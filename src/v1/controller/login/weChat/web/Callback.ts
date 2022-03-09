import { FastifySchema, ResponseError } from "../../../../../types/Server";
import redisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { wechatCallback } from "../Utils";
import { parseError } from "../../../../../logger";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { WeChat } from "../../../../../constants/Config";

@Controller<RequestType, any>({
    method: "get",
    path: "login/weChat/web/callback",
    auth: false,
    skipAutoHandle: true,
    enable: WeChat.web.enable,
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

        await wechatCallback(code, authUUID, "WEB", this.logger, this.reply);
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        this.logger.error("request failed", parseError(error));
        await redisService.set(RedisKey.authFailed(this.querystring.state), "", 60 * 60);

        return this.autoHandlerError(error);
    }
}

interface RequestType {
    querystring: {
        state: string;
        code: string;
    };
}
