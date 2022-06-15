import { Controller } from "../../../../decorator/Controller";
import { WeChat } from "../../../../constants/Config";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Logger, LoggerAPI } from "../../../../logger";
import redisService from "../../../../thirdPartyService/RedisService";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { LoginWechat } from "../../login/platforms/LoginWechat";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";

@Controller<RequestType, any>({
    method: "get",
    path: "user/bindingWechat/binding/web",
    auth: false,
    skipAutoHandle: true,
    enable: WeChat.web.enable,
})
export class BindingWeb extends AbstractController<RequestType, any> {
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
        const { state: authUUID, code } = this.querystring;

        void this.reply.headers({
            "content-type": "text/html",
        });
        void this.reply.send();

        await wechatCallback(code, authUUID, "WEB", this.logger);

        await redisService.set(RedisKey.bindingAuthStatus(this.querystring.state), "true", 60 * 60);
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        await redisService.set(
            RedisKey.bindingAuthStatus(this.querystring.state),
            "false",
            60 * 60,
        );

        return this.autoHandlerError(error);
    }
}

@Controller<RequestType, any>({
    method: "get",
    path: "user/bindingWechat/binding/mobile",
    auth: false,
    skipAutoHandle: true,
    enable: WeChat.mobile.enable,
})
export class BindingMobile extends AbstractController<RequestType, any> {
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

    public async execute(): Promise<Response<any>> {
        const { state: authUUID, code } = this.querystring;

        await wechatCallback(code, authUUID, "MOBILE", this.logger);

        await redisService.set(RedisKey.bindingAuthStatus(this.querystring.state), "true", 60 * 60);

        return {
            status: Status.Success,
            data: {},
        };
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        await redisService.set(
            RedisKey.bindingAuthStatus(this.querystring.state),
            error instanceof ControllerError ? String(error.errorCode) : "false",
            60 * 60,
        );

        return this.autoHandlerError(error);
    }
}

const wechatCallback = async (
    code: string,
    authUUID: string,
    type: "WEB" | "MOBILE",
    logger: Logger<LoggerAPI>,
): Promise<void> => {
    const userUUID = await RedisService.get(RedisKey.bindingAuthUUID(authUUID));

    if (userUUID === null) {
        logger.warn("uuid verification failed");
        throw new ControllerError(ErrorCode.ParamsCheckFailed);
    }

    const userInfo = await LoginWechat.getUserInfoAndToken(code, type);

    const userUUIDByDB = await ServiceUserWeChat.userUUIDByUnionUUID(userInfo.unionUUID);

    if (userUUIDByDB) {
        throw new ControllerError(ErrorCode.UserAlreadyBinding);
    }

    const wechatSVC = new ServiceUserWeChat(userUUID);

    await wechatSVC.create(userInfo);
};

interface RequestType {
    querystring: {
        state: string;
        code: string;
    };
}
