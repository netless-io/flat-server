import { Queue } from "./Create";
import { createLoggerRTCVoice, Logger, parseError } from "../../logger";
import { LoggerRTCVoice } from "../../logger/LogConext";
import { RoomDAO } from "../../dao";
import { RoomStatus, RoomType } from "../../model/room/Constants";
import {
    agoraCloudRecordAcquireRequest,
    agoraCloudRecordStartedRequest,
    agoraCloudRecordStoppedRequest,
} from "../utils/request/agora/Agora";
import { getRTCToken } from "../utils/AgoraToken";
import { Censorship } from "../../constants/Config";
import { Not } from "typeorm";
import { RoomModel } from "../../model/room/Room";
import { AGORA_SCREENSHOT_UID, AGORA_VOICE_UID } from "../../constants/Agora";
import { createHmac } from "crypto";

export class RTCVoiceQueue {
    private static readonly queueName = "RTCVoice";

    private readonly queue: Queue<JobData>;
    private readonly logger: Logger<LoggerRTCVoice>;

    public constructor() {
        if (Censorship.voice.enable) {
            this.logger = createLoggerRTCVoice({
                queue: {
                    name: RTCVoiceQueue.queueName,
                },
            });

            this.queue = new Queue(RTCVoiceQueue.queueName, this.logger);

            this.queue.handler(async job => {
                const rtcVoice = new RTCVoice(job.data, this.logger);

                try {
                    const result = await rtcVoice.handler();

                    switch (result.nextStatus) {
                        case "Start": {
                            this._add(
                                {
                                    ...result.data,
                                    status: "Start",
                                },
                                result.delay,
                            );
                            break;
                        }
                        case "Stop": {
                            this._add(
                                {
                                    ...result.data,
                                    status: "Stop",
                                },
                                result.delay,
                            );
                            break;
                        }
                        case "Break": {
                            break;
                        }
                    }
                } catch (error) {
                    this.logger.error("handler error", {
                        queueDetail: {
                            jobID: String(job.id),
                        },
                        rtcDetail: {
                            roomUUID: job.data.roomUUID,
                        },
                        ...parseError(error),
                    });
                }
            });
        }
    }

    public add(roomUUID: string, delay?: number): void {
        this._add(
            {
                status: "Start",
                roomUUID,
            },
            delay || 1000 * 60,
        );
    }

    private _add(data: JobData, delay: number): void {
        if (Censorship.voice.enable) {
            this.queue
                .add(data, {
                    delay,
                })
                .catch(error => {
                    this.logger.error("add task error", {
                        ...parseError(error),
                        rtcDetail: data,
                    });
                });
        }
    }
}

export const rtcVoiceQueue = new RTCVoiceQueue();

class RTCVoice {
    constructor(private readonly data: JobData, private readonly logger: Logger<LoggerRTCVoice>) {}

    public async handler(): Promise<RTCVoiceStatus> {
        const roomInfo = await RTCVoice.roomInfo(this.data.roomUUID);
        if (!roomInfo) {
            return {
                nextStatus: "Break",
            };
        }

        switch (this.data.status) {
            case "Start": {
                const { resourceID, sid } = await this.start(roomInfo.room_type);

                return {
                    nextStatus: "Stop",
                    delay: 1000 * 60,
                    data: {
                        resourceID,
                        sid,
                        roomUUID: this.data.roomUUID,
                    },
                };
            }
            case "Stop": {
                const stopSuccess = await this.tryStopPreviousService();

                return {
                    nextStatus: "Start",
                    // Wait 10 minute on success
                    // Wait 30 minute on failure
                    // The probability of failure is that there are no streams in the room, at which point the delay should be increased. Avoid wasting resources
                    delay: stopSuccess ? 1000 * 60 * 10 : 1000 * 60 * 30,
                    data: {
                        roomUUID: this.data.roomUUID,
                    },
                };
            }
        }
    }

    private async acquire(): Promise<string> {
        this.logger.debug("get resourceID", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
            },
        });

        // see: https://docs.agora.io/cn/cloud-recording/audio_inspect_restful?platform=RESTful#获取审核资源的-api
        // NOTE: No English description available at the moment
        const { resourceId } = await agoraCloudRecordAcquireRequest({
            ...this.agoraBasicReqData,
            clientRequest: {
                resourceExpiredHour: 24,
                scene: 0,
            },
        });

        this.logger.debug("get resourceID success", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
                resourceID: resourceId,
            },
        });

        return resourceId;
    }

    private async start(roomType: RoomType): Promise<{ resourceID: string; sid: string }> {
        const resourceID = await this.acquire();

        this.logger.debug("start voice", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
            },
        });

        // see: https://docs.agora.io/cn/cloud-recording/audio_inspect_restful?platform=RESTful#开始审核的-api
        const { sid } = await agoraCloudRecordStartedRequest(
            {
                mode: "mix",
                resourceid: resourceID,
            },
            {
                ...this.agoraBasicReqData,
                clientRequest: {
                    token: await getRTCToken(this.data.roomUUID, AGORA_VOICE_UID),
                    recordingConfig: {
                        channelType: roomType === RoomType.BigClass ? 1 : 0,
                        streamTypes: 0,
                        subscribeUidGroup: roomType === RoomType.BigClass ? 1 : 0,
                        unSubscribeAudioUids: [String(AGORA_SCREENSHOT_UID)],
                    },
                    extensionServiceConfig: {
                        extensionServices: [
                            {
                                serviceName: "aliyun_voice_async_scan",
                                streamTypes: 0,
                                serviceParam: {
                                    callbackAddr: Censorship.voice.aliCloud.callbackAddress,
                                    apiData: {
                                        accessKey: Censorship.voice.aliCloud.accessID,
                                        secretKey: Censorship.voice.aliCloud.accessSecret,
                                        callbackSeed: createHmac(
                                            "sha256",
                                            Censorship.voice.aliCloud.accessSecret,
                                        )
                                            .update(this.data.roomUUID, "utf8")
                                            .digest("hex"),
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        );

        this.logger.debug("start voice success", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
                resourceID,
                sid,
            },
        });

        return { resourceID, sid };
    }

    // @ts-ignore
    private async tryStopPreviousService(): Promise<number | void> {
        if (!this.data.sid || !this.data.resourceID) {
            this.logger.debug("skip stop voice", {
                rtcDetail: {
                    roomUUID: this.data.roomUUID,
                },
            });
            return;
        }

        this.logger.debug("stop voice", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
            },
        });

        // see: https://docs.agora.io/cn/cloud-recording/audio_inspect_restful?platform=RESTful#停止审核的-api
        return await agoraCloudRecordStoppedRequest(
            {
                sid: this.data.sid,
                mode: "mix",
                resourceid: this.data.resourceID,
            },
            {
                ...this.agoraBasicReqData,
                clientRequest: {
                    async_stop: false,
                },
            },
        )
            .then(() => {
                this.logger.debug("stop voice success", {
                    rtcDetail: {
                        roomUUID: this.data.roomUUID,
                        resourceID: this.data.resourceID,
                        sid: this.data.sid,
                    },
                });
            })
            .catch(error => {
                this.logger.debug("stop voice failed. Maybe cannot find any stream", {
                    ...parseError(error),
                    rtcDetail: {
                        roomUUID: this.data.roomUUID,
                        resourceID: this.data.resourceID,
                        sid: this.data.sid,
                    },
                });

                // The probability of failure is that there are no streams in the room, at which point the delay should be increased. Avoid wasting resources
                return 1000 * 60 * 30;
            });
    }

    private static async roomInfo(
        roomUUID: string,
    ): Promise<Pick<RoomModel, "room_type"> | undefined> {
        const result = await RoomDAO().findOne(["room_type"], {
            room_uuid: roomUUID,
            room_status: Not(RoomStatus.Stopped),
        });

        return result;
    }

    private get agoraBasicReqData(): { uid: string; cname: string } {
        return {
            uid: String(AGORA_VOICE_UID),
            cname: this.data.roomUUID,
        };
    }
}

type JobData = {
    status: "Start" | "Stop";
    sid?: string;
    resourceID?: string;
    roomUUID: string;
};

type RTCVoiceStatus =
    | {
          nextStatus: "Start";
          delay: number;
          data: Omit<JobData, "status">;
      }
    | {
          nextStatus: "Stop";
          delay: number;
          data: Required<Omit<JobData, "status">>;
      }
    | {
          nextStatus: "Break";
      };
