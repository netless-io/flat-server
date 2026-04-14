import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { wechatCallback } from "../Utils";
import redisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { Status } from "../../../../../constants/Project";
import { parseError } from "../../../../../logger";
import { WeChat } from "../../../../../constants/Config";
import { ServiceUserPhone } from "../../../../service/user/UserPhone";
import { ServiceUser } from "../../../../service/user/User";

@Controller<RequestType, ResponseType>({
    method: "get",
    path: "login/weChat/mobile/callback",
    auth: false,
    enable: WeChat.mobile.enable,
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

        const result = await wechatCallback(code, authUUID, "MOBILE", this.logger, this.reply);

        return {
            status: Status.Success,
            data: {
                ...result,
                hasPhone: await ServiceUserPhone.exist(result.userUUID),
                hasPassword: await ServiceUser.hasPassword(result.userUUID),
            },
        };
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

interface ResponseType {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
    hasPhone: boolean;
    hasPassword: boolean;
}
