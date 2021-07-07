import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { registerOrLoginWechat } from "../Utils";
import redisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { AbstractController } from "../../../../../abstract/Controller";
import { Controller } from "../../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "get",
    path: "login/weChat/mobile/callback",
    auth: false,
})
export class WechatMobileCallback extends AbstractController<RequestType, ResponseType> {
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

    public async execute(): Promise<Response<ResponseType>> {
        const { state: authUUID, code } = this.querystring;

        return await registerOrLoginWechat(code, authUUID, "MOBILE", this.logger, this.reply);
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
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

interface ResponseType {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
}
