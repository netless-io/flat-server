import { FastifySchema, ResponseError } from "../../../../types/Server";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { Agora } from "../../../../constants/Config";
import {
    CloudRecording,
    IRecorderSnapshotFile,
    MessageNotificationPublicField,
} from "./internal/Type";
import { createHmac } from "crypto";
import { Events } from "./internal/Events";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

@Controller<RequestType, any>({
    method: "post",
    path: "agora/message/callback",
    auth: false,
    skipAutoHandle: true,
    enable: Agora.messageNotification.enable,
})
export class MessageCallback extends AbstractController<RequestType> {
    public static readonly schema: FastifySchema<RequestType> = {
        headers: {
            type: "object",
            required: ["agora-signature-v2"],
            properties: {
                "agora-signature-v2": {
                    type: "string",
                },
            },
        },
        body: {
            type: "object",
            required: ["noticeId", "productId", "eventType", "notifyMs"],
            properties: {
                noticeId: {
                    type: "string",
                },
                productId: {
                    type: "integer",
                },
                eventType: {
                    type: "integer",
                },
                notifyMs: {
                    type: "integer",
                },
                payload: {
                    type: "object",
                    required: [
                        "cname",
                        "uid",
                        "sid",
                        "sendts",
                        "sequence",
                        "serviceType",
                        "details",
                    ],
                    properties: {
                        cname: {
                            type: "string",
                        },
                        uid: {
                            type: "string",
                        },
                        sid: {
                            type: "string",
                        },
                        sendts: {
                            type: "integer",
                        },
                        sequence: {
                            type: "integer",
                        },
                        serviceType: {
                            type: "integer",
                        },
                        details: {
                            type: "object",
                            required: ["msgName", "fileName"],
                            properties: {
                                msgName: {
                                    type: "string",
                                },
                                fileName: {
                                    type: "string",
                                },
                            },
                        },
                    },
                },
            },
        },
    };

    public async execute(): Promise<void> {
        void this.reply.send({});
        const { productId, eventType, payload } = this.body;

        const events = new Events(productId, eventType);

        if (!events.secret) {
            this.logger.debug(
                `cannot find secret. productId: ${productId}. eventType: ${eventType}`,
            );
            return;
        }

        if (!events.enable) {
            this.logger.debug("event not open");
            return;
        }

        this.assertSignatureCorrect(events.secret);

        await events.handler(payload);
    }

    private assertSignatureCorrect(secret: string): void {
        const text = JSON.stringify(this.req.body);

        const localKey = createHmac("sha256", secret).update(text, "utf8").digest("hex");

        const remoteKey = this.req.headers["agora-signature-v2"] as string;

        if (localKey !== remoteKey) {
            this.logger.warn(
                `agora sign not same. local key: ${localKey}. remote key: ${remoteKey}. text: ${text}`,
            );
            throw new ControllerError(ErrorCode.RequestSignatureIncorrect);
        }
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: MessageNotificationPublicField<CloudRecording<IRecorderSnapshotFile>>;
    headers: {
        "agora-signature-v2": string;
    };
}
