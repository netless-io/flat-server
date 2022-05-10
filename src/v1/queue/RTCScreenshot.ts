import { Queue } from "./Create";
import { createLoggerRTCScreenshot, Logger, parseError } from "../../logger";
import { LoggerRTCScreenshot } from "../../logger/LogConext";
import { RoomDAO } from "../../dao";
import { RoomStatus } from "../../model/room/Constants";
import {
    agoraCloudRecordAcquireRequest,
    agoraCloudRecordStartedRequest,
    agoraCloudRecordStoppedRequest,
} from "../utils/request/agora/Agora";
import { getRTCToken } from "../utils/AgoraToken";
import { Agora } from "../../constants/Config";
import { Not } from "typeorm";

export class RTCScreenshotQueue {
    public static readonly queueName = "RTCScreenshot";

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
                            this.add(result.data);
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
                    this.add(job.data);
                }
            });
        }
    }

    public add(data: JobData, immediate = false): void {
        if (Agora.screenshot.enable) {
            this.queue
                .add(data, {
                    delay: immediate ? undefined : 1000 * 60,
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
        if (await RTCScreenshot.roomIsStopped(this.data.roomUUID)) {
            return {
                status: "Break",
            };
        }

        const resourceID = await this.acquire();
        await this.stop(resourceID);

        const sid = await this.start(resourceID);

        return {
            status: "ADD",
            data: {
                sid,
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

    private async start(resourceID: string): Promise<string> {
        const fileNamePrefix = [Agora.screenshot.oss.folder, this.data.roomUUID.replace(/-/g, "")];

        this.logger.debug("start screenshot", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
                fileNamePrefix: fileNamePrefix.join("/"),
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
                        channelType: 1,
                        streamTypes: 1,
                        subscribeUidGroup: 0,
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
                        fileNamePrefix,
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

        return sid;
    }

    private async stop(resourceID: string): Promise<void> {
        if (!this.data.sid) {
            return;
        }

        this.logger.debug("stop screenshot", {
            rtcDetail: {
                roomUUID: this.data.roomUUID,
            },
        });

        // see: https://docs.agora.io/en/cloud-recording/cloud_recording_screen_capture?platform=RESTful#start-recording
        await agoraCloudRecordStoppedRequest(
            {
                sid: this.data.sid,
                mode: "individual",
                resourceid: resourceID,
            },
            {
                ...this.agoraBasicReqData,
                clientRequest: {
                    async_stop: true,
                },
            },
        )
            .then(() => {
                this.logger.debug("stop screenshot success", {
                    rtcDetail: {
                        roomUUID: this.data.roomUUID,
                        resourceID,
                        sid: this.data.sid,
                    },
                });
            })
            .catch(error => {
                this.logger.warn("stop screenshot failed", parseError(error));
            });
    }

    private static async roomIsStopped(roomUUID: string): Promise<boolean> {
        const result = await RoomDAO().findOne(["id"], {
            room_uuid: roomUUID,
            room_status: Not(RoomStatus.Stopped),
        });

        return !result;
    }

    private get agoraBasicReqData(): { uid: string; cname: string } {
        return {
            uid: String(RTCScreenshot.AGORA_UID),
            cname: `${RTCScreenshotQueue.queueName}-${this.data.roomUUID}`,
        };
    }
}

type JobData = {
    sid?: string;
    roomUUID: string;
};

type RTCScreenshotStatus =
    | {
          status: "ADD";
          data: Required<JobData>;
      }
    | {
          status: "Break";
      };
