import { Queue } from "./Create";
import { createLoggerRTCScreenshot, Logger, parseError } from "../../logger";
import { LoggerRTCScreenshot } from "../../logger/LogConext";
import { RoomDAO } from "../../dao";
import { RoomStatus, RoomType } from "../../model/room/Constants";
import {
    agoraCloudRecordAcquireRequest,
    agoraCloudRecordStartedRequest,
    agoraCloudRecordStoppedRequest,
} from "../utils/request/agora/Agora";
import { getRTCToken } from "../utils/AgoraToken";
import { Agora } from "../../constants/Config";
import { Not } from "typeorm";
import { RoomModel } from "../../model/room/Room";
import { AGORA_SCREENSHOT_UID, AGORA_VOICE_UID } from "../../constants/Agora";

export class RTCScreenshotQueue {
    private static readonly queueName = "RTCScreenshot";

    private readonly queue: Queue<JobData>;
    private readonly logger: Logger<LoggerRTCScreenshot>;

    public constructor() {
        if (Agora.screenshot.enable) {
            this.logger = createLoggerRTCScreenshot({
                queue: {
                    name: RTCScreenshotQueue.queueName,
                },
            });

            this.queue = new Queue(RTCScreenshotQueue.queueName, this.logger);

            this.queue.handler(async job => {
                const rtcScreenshot = new RTCScreenshot(job.data, this.logger);

                try {
                    const result = await rtcScreenshot.handler();

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
        if (Agora.screenshot.enable) {
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

export const rtcScreenshotQueue = new RTCScreenshotQueue();

class RTCScreenshot {
    constructor(
        private readonly data: JobData,
        private readonly logger: Logger<LoggerRTCScreenshot>,
    ) {}

    public async handler(): Promise<RTCScreenshotStatus> {
        const roomInfo = await RTCScreenshot.roomInfo(this.data.roomUUID);
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
                const within30Minutes =
                    Math.abs(Date.now() - roomInfo.begin_time.valueOf()) < 1000 * 60 * 30;

                return {
                    nextStatus: "Start",
                    // Wait 10 minutes on success or within 30 minutes
                    // Wait 120 minutes on failure
                    // The probability of failure is that there are no streams in the room, at which point the delay should be increased. Avoid wasting resources
                    delay: stopSuccess || within30Minutes ? 1000 * 60 * 10 : 1000 * 60 * 60 * 2,
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

        // see: https://docs.agora.io/en/cloud-recording/cloud_recording_screen_capture?platform=RESTful#get-a-resource-id
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

        this.logger.debug("start screenshot", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
            },
        });

        // see: https://docs.agora.io/en/cloud-recording/cloud_recording_screen_capture?platform=RESTful#start-recording
        const { sid } = await agoraCloudRecordStartedRequest(
            {
                mode: "individual",
                resourceid: resourceID,
            },
            {
                ...this.agoraBasicReqData,
                clientRequest: {
                    token: await getRTCToken(this.data.roomUUID, AGORA_SCREENSHOT_UID),
                    recordingConfig: {
                        channelType: roomType === RoomType.BigClass ? 1 : 0,
                        streamTypes: 1,
                        subscribeUidGroup: roomType === RoomType.BigClass ? 1 : 0,
                        unSubscribeVideoUids: [String(AGORA_VOICE_UID)],
                    },
                    snapshotConfig: {
                        captureInterval: 15,
                        fileType: ["jpg"],
                    },
                    storageConfig: {
                        accessKey: Agora.screenshot.oss.accessKeyId,
                        region: Agora.screenshot.oss.region,
                        bucket: Agora.screenshot.oss.bucket,
                        secretKey: Agora.screenshot.oss.accessKeySecret,
                        vendor: Agora.screenshot.oss.vendor,
                        fileNamePrefix: [
                            Agora.screenshot.oss.folder,
                            this.data.roomUUID.replace(/-/g, ""),
                        ],
                    },
                },
            },
        );

        this.logger.debug("start screenshot success", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
                resourceID,
                sid,
            },
        });

        return { resourceID, sid };
    }

    private async tryStopPreviousService(): Promise<boolean> {
        if (!this.data.sid || !this.data.resourceID) {
            this.logger.debug("skip stop screenshot", {
                rtcDetail: {
                    roomUUID: this.data.roomUUID,
                },
            });
            return true;
        }

        this.logger.debug("stop screenshot", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
            },
        });

        // see: https://docs.agora.io/en/cloud-recording/cloud_recording_screen_capture?platform=RESTful#start-recording
        return await agoraCloudRecordStoppedRequest(
            {
                sid: this.data.sid,
                mode: "individual",
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
                this.logger.debug("stop screenshot success", {
                    rtcDetail: {
                        roomUUID: this.data.roomUUID,
                        resourceID: this.data.resourceID,
                        sid: this.data.sid,
                    },
                });
                return true;
            })
            .catch(error => {
                this.logger.debug("stop screenshot failed. Maybe cannot find any stream", {
                    ...parseError(error),
                    rtcDetail: {
                        roomUUID: this.data.roomUUID,
                        resourceID: this.data.resourceID,
                        sid: this.data.sid,
                    },
                });

                return false;
            });
    }

    private static async roomInfo(
        roomUUID: string,
    ): Promise<Pick<RoomModel, "room_type" | "begin_time"> | undefined> {
        const result = await RoomDAO().findOne(["room_type", "begin_time"], {
            room_uuid: roomUUID,
            room_status: Not(RoomStatus.Stopped),
        });

        return result;
    }

    private get agoraBasicReqData(): { uid: string; cname: string } {
        return {
            uid: String(AGORA_SCREENSHOT_UID),
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

type RTCScreenshotStatus =
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
