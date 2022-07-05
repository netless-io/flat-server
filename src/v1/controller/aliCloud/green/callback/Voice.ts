import { Controller } from "../../../../../decorator/Controller";
import { Censorship, JWT, Server } from "../../../../../constants/Config";
import { AbstractController } from "../../../../../abstract/controller";
import { FastifySchema, ResponseError } from "../../../../../types/Server";
import { parseError } from "../../../../../logger";
import { createHash, createHmac } from "crypto";
import { ControllerError } from "../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../ErrorCode";
import { RedisKey } from "../../../../../utils/Redis";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RoomDAO } from "../../../../../dao";
import { RoomStatus } from "../../../../../model/room/Constants";
import { LoginPlatform } from "../../../../../constants/Project";
import { RouterMetadata } from "../../../../../decorator/Metadata";
import { UpdateStatusStopped } from "../../../room/updateStatus/Stopped";
import { ax } from "../../../../utils/Axios";
import { Algorithm, createSigner } from "fast-jwt";

@Controller<RequestType, any>({
    method: "post",
    path: "aliCloud/green/callback/voice",
    auth: false,
    skipAutoHandle: true,
    enable: Censorship.voice.enable,
})
export class VoiceCallback extends AbstractController<RequestType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["checksum", "content"],
            properties: {
                checksum: {
                    type: "string",
                },
                content: {
                    type: "string",
                },
            },
        },
    };

    private static signer = createSigner({
        algorithm: JWT.algorithms as Algorithm,
        iss: Server.name,
        key: JWT.secret,
        expiresIn: 1000 * 60 * 3,
    });

    public async execute(): Promise<void> {
        void this.reply.send({});

        const content = this.parseContent();

        this.assertSignatureCorrect(content.dataId.channelName);

        if (VoiceCallback.isError(content)) {
            this.logger.warn("aliCloud green callback request failed");
            return;
        }

        if (VoiceCallback.isIllegal(content)) {
            this.logger.info("voice illegal");

            const key = RedisKey.voiceIllegalCount(content.dataId.channelName);
            // Redis incr init value is 0
            const count = (await RedisService.incr(key)) + 1;

            if (count === 1) {
                await RedisService.expire(key, 60 * 30);
            }

            if (count >= 3) {
                await this.banRoom(content.dataId.channelName);
            }
        }

        return;
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private static isError(content: Content): boolean {
        return !String(content.code).startsWith("2") || content.results === undefined;
    }

    private static isIllegal(content: Content): boolean {
        return content.results!.some(item => item.suggestion === "block");
    }

    private parseContent(): Content {
        let content = null;
        try {
            content = JSON.parse(this.body.content);
            content = {
                ...content,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                dataId: JSON.parse(content?.dataId),
            };
        } catch (error) {
            this.logger.info("parse content failed", parseError(error));
        }

        if (content === null) {
            throw new ControllerError(ErrorCode.ParamsCheckFailed);
        }

        return content as Content;
    }

    private assertSignatureCorrect(roomUUID: string): void {
        const seed = createHmac("sha256", Censorship.voice.aliCloud.accessSecret)
            .update(roomUUID, "utf8")
            .digest("hex");

        const text = `${Censorship.voice.aliCloud.uid}${seed}${this.body.content}`;

        const localKey = createHash("sha256").update(text).digest("hex");
        const remoteKey = this.body.checksum;

        if (localKey !== remoteKey) {
            this.logger.warn(
                `aliCloud green callback sign not same. local key: ${localKey}. remote key: ${remoteKey}. text: ${text}`,
            );
            throw new ControllerError(ErrorCode.RequestSignatureIncorrect);
        }
    }

    private async banRoom(roomUUID: string): Promise<void> {
        this.logger.debug("ready ban room");

        const roomInfo = await RoomDAO().findOne(["owner_uuid", "room_status"], {
            room_uuid: roomUUID,
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

        const token = VoiceCallback.signer({
            userUUID,
            loginSource: LoginPlatform.Agora,
        });

        const path = Reflect.getMetadata(RouterMetadata.PATH, UpdateStatusStopped) as string;
        const serverURL = `http://127.0.0.1:${Server.port}/v1/${path}`;

        this.logger.debug("generate temp jwt token and ready send request");

        await ax
            .post(
                serverURL,
                {
                    roomUUID,
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
}

type RequestType = {
    body: {
        checksum: string;
        content: string;
    };
};

type Content = {
    code: number;
    dataId: {
        channelName: string;
    };
    msg: string;
    results?: Array<{
        details: Array<{
            endTime: number;
            label: string;
            startTime: number;
            text: string;
        }>;
        label: string;
        rate: number;
        scene: string;
        suggestion: string;
    }>;
    taskId: string;
    url: string;
};
