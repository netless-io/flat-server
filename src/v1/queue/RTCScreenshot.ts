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

                    switch (result.status) {
                        case "ADD": {
                            this.add(result.data, result.delay);
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

    public add(data: JobData, delay?: number): void {
        if (Agora.screenshot.enable) {
            this.queue
                .add(data, {
                    delay: delay || 1000 * 60,
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
    private static AGORA_UID = 15;

    constructor(
        private readonly data: JobData,
        private readonly logger: Logger<LoggerRTCScreenshot>,
    ) {}

    public async handler(): Promise<RTCScreenshotStatus> {
        const roomInfo = await RTCScreenshot.roomInfo(this.data.roomUUID);
        if (!roomInfo) {
            return {
                status: "Break",
            };
        }

        // Wait 30 minute on failure
        // Wait 10 minute on success
        const delay = (await this.tryStopPreviousService()) || 1000 * 60 * 10;

        const { resourceID, sid } = await this.start(roomInfo.room_type);

        return {
            status: "ADD",
            delay,
            data: {
                sid,
                resourceID,
                roomUUID: this.data.roomUUID,
            },
        };
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
                    token: await getRTCToken(this.data.roomUUID, RTCScreenshot.AGORA_UID),
                    recordingConfig: {
                        channelType: roomType === RoomType.BigClass ? 1 : 0,
                        streamTypes: 1,
                        subscribeUidGroup: roomType === RoomType.BigClass ? 1 : 0,
                        subscribeVideoUids: ["#allstream#"],
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

    private async tryStopPreviousService(): Promise<number | void> {
        if (!this.data.sid || !this.data.resourceID) {
            this.logger.debug("skip stop screenshot", {
                rtcDetail: {
                    roomUUID: this.data.roomUUID,
                },
            });
            return;
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
            uid: String(RTCScreenshot.AGORA_UID),
            cname: this.data.roomUUID,
        };
    }
}

type JobData = {
    sid?: string;
    resourceID?: string;
    roomUUID: string;
};

type RTCScreenshotStatus =
    | {
          status: "ADD";
          delay: number | undefined;
          data: Required<JobData>;
      }
    | {
          status: "Break";
      };
