import { Controller } from "../../../../../decorator/Controller";
import { Censorship } from "../../../../../constants/Config";
import { AbstractController } from "../../../../../abstract/controller";
import { FastifySchema, ResponseError } from "../../../../../types/Server";

@Controller<RequestType, any>({
    method: "post",
    path: "aliCloud/green/callback/voice",
    auth: false,
    skipAutoHandle: true,
    enable: Censorship.voice.enable,
})
export class VoiceCallback extends AbstractController<RequestType> {
    public static readonly schema: FastifySchema<RequestType> = {};

    /**
     * TODO: Waiting to be implemented
     */
    public async execute(): Promise<void> {
        void this.reply.send({});

        await Promise.resolve();
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

type RequestType = {
    body: {
        // ...
    };
};
