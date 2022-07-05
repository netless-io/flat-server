import { CloudRecording, IRecorderSnapshotFile } from "./Type";
import { Agora, Censorship, JWT, Server } from "../../../../../constants/Config";
import { RoomDAO } from "../../../../../dao";
import { createLoggerContentCensorship, Logger, parseError } from "../../../../../logger";
import { LoggerContentCensorship } from "../../../../../logger/LogConext";
import { RoomStatus } from "../../../../../model/room/Constants";
import { ax } from "../../../../utils/Axios";
import { LoginPlatform } from "../../../../../constants/Project";
import { RouterMetadata } from "../../../../../decorator/Metadata";
import { UpdateStatusStopped } from "../../../room/updateStatus/Stopped";
import { Algorithm, createSigner } from "fast-jwt";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { aliGreenVideo } from "../../../../utils/AliGreen";

export class RecorderSnapshotFile {
    public static productId = 3;
    public static eventType = 45;
    public static hitFlag =
        `${RecorderSnapshotFile.productId}:${RecorderSnapshotFile.eventType}` as const;
    public static secret = (() => {
        for (const { secret, productID, eventType } of Agora.messageNotification.events) {
            if (
                productID === RecorderSnapshotFile.productId &&
                eventType === RecorderSnapshotFile.eventType
            ) {
                return secret;
            }
        }
        return null;
    })();

    public static enable = Agora.screenshot.enable;

    public constructor(private readonly payload: CloudRecording<IRecorderSnapshotFile>) {}

    public async execute(): Promise<void> {
        if (Censorship.video.enable) {
            await new CensorshipVideo(this.payload).execute();
        }
    }
}

class CensorshipVideo {
    private static signer = createSigner({
        algorithm: JWT.algorithms as Algorithm,
        iss: Server.name,
        key: JWT.secret,
        expiresIn: 1000 * 60 * 3,
    });

    private logger: Logger<LoggerContentCensorship>;

    public constructor(private readonly payload: CloudRecording<IRecorderSnapshotFile>) {
        this.logger = createLoggerContentCensorship({
            censorship: {
                roomUUID: this.payload.cname,
            },
        });
    }

    public async execute(): Promise<void> {
        if (await this.isIllegal()) {
            const key = RedisKey.videoIllegalCount(this.roomUUID);
            // Redis incr init value is 0
            const count = (await RedisService.incr(key)) + 1;

            if (count === 1) {
                await RedisService.expire(key, 60 * 30);
            }

            if (count >= 3) {
                await this.banRoom();
            }
        }

        return;
    }

    private async isIllegal(): Promise<boolean> {
        this.logger.debug("check image url", {
            censorshipDetail: {
                imageURL: this.imageURL,
            },
        });

        const result = await aliGreenVideo.imageScan(this.imageURL);

        if (!result.status) {
            this.logger.error("image scan request failed", parseError(result.error));
            return false;
        }

        if (result.data.every(i => i.suggestion !== "block")) {
            return false;
        }

        this.logger.debug("video illegal", {
            censorshipDetail: {
                imageURL: this.imageURL,
            },
            censorshipResult: JSON.stringify(result.data),
        });

        return true;
    }

    private async banRoom(): Promise<void> {
        this.logger.debug("ready ban room");

        const roomInfo = await RoomDAO().findOne(["owner_uuid", "room_status"], {
            room_uuid: this.roomUUID,
        });

        if (roomInfo === undefined) {
            this.logger.info("room has been deleted");
            return;
        }

        const { owner_uuid: userUUID, room_status: roomStatus } = roomInfo;

        if (roomStatus === RoomStatus.Stopped) {
            this.logger.info("room has benn stopped");
            return;
        }

        const token = CensorshipVideo.signer({
            userUUID,
            loginSource: LoginPlatform.Agora,
        });

        const path = Reflect.getMetadata(RouterMetadata.PATH, UpdateStatusStopped) as string;
        const serverURL = `http://127.0.0.1:${Server.port}/v1/${path}`;

        this.logger.debug("generate temp jwt token and ready send request", {
            censorshipDetail: {
                jwtToken: token,
                serverURL,
                mockUserUUID: userUUID,
            },
        });

        await ax
            .post(
                serverURL,
                {
                    roomUUID: this.roomUUID,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            )
            .then(() => {
                this.logger.info("ban room success");
            })
            .catch(error => {
                this.logger.error("send stop request failed", parseError(error));
            });
    }

    private get imageURL(): string {
        return `${Agora.screenshot.oss.prefix}/${this.payload.details.fileName}`;
    }

    private get roomUUID(): string {
        return this.payload.cname;
    }
}
