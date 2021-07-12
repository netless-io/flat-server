import { FastifySchema, ResponseError } from "../../../../../types/Server";
import redisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { registerOrLoginWechat } from "../Utils";
import { parseError } from "../../../../../logger";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";

@Controller<RequestType, any>({
    method: "get",
    path: "login/weChat/web/callback",
    auth: false,
    skipAutoHandle: true,
})
export class WechatWebCallback extends AbstractController<RequestType> {
    public static readonly schema: FastifySchema<RequestType> = {
        querystring: {
            type: "object",
            required: ["state", "code"],
            properties: {
                state: {
                    type: "string",
                    format: "uuid-v4",
                },
                code: {
                    type: "string",
                },
            },
        },
    };

    public async execute(): Promise<void> {
        void this.reply.headers({
            "content-type": "text/html",
        });
        void this.reply.send();

        const { state: authUUID, code } = this.querystring;

        try {
            await registerOrLoginWechat(code, authUUID, "WEB", this.logger, this.reply);
        } catch (err: unknown) {
            this.logger.error("request failed", parseError(err));
            await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);
        }
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    querystring: {
        state: string;
        code: string;
    };
}
