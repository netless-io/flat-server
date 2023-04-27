import { Controller } from "../../../../../../decorator/Controller";
import { WeChat } from "../../../../../../constants/Config";
import { AbstractController } from "../../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../../types/Server";
import { Logger, LoggerAPI, parseError } from "../../../../../../logger";
import RedisService from "../../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../../utils/Redis";
import { LoginWechat } from "../../../../login/platforms/LoginWechat";
import { ServiceUserWeChat } from "../../../../../service/user/UserWeChat";
import { ControllerError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";
import { Status } from "../../../../../../constants/Project";
import { ServiceUserSensitive } from "../../../../../service/user/UserSensitive";

@Controller<RequestType, any>({
    method: "get",
    path: "user/binding/platform/wechat/web",
    auth: false,
    skipAutoHandle: true,
    enable: WeChat.web.enable,
})
export class BindingWeChatWeb extends AbstractController<RequestType, any> {
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

        await RedisService.set(RedisKey.bindingAuthStatus(this.querystring.state), "true", 60 * 60);
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        await RedisService.set(
            RedisKey.bindingAuthStatus(this.querystring.state),
            "false",
            60 * 60,
        );

        this.logger.error("bind web webChat failed", parseError(error));

        return this.autoHandlerError(error);
    }
}

@Controller<RequestType, any>({
    method: "get",
    path: "user/binding/platform/wechat/mobile",
    auth: false,
    enable: WeChat.mobile.enable,
})
export class BindingWeChatMobile extends AbstractController<RequestType, any> {
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

        await RedisService.set(RedisKey.bindingAuthStatus(this.querystring.state), "true", 60 * 60);

        return {
            status: Status.Success,
            data: {},
        };
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        await RedisService.set(
            RedisKey.bindingAuthStatus(this.querystring.state),
            error instanceof ControllerError ? String(error.errorCode) : "false",
            60 * 60,
        );

        this.logger.error("bind mobile webChat failed", parseError(error));

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

    const wechatSVC = new ServiceUserWeChat(userUUID);
    const sensitiveSVC = new ServiceUserSensitive(userUUID);

    const exist = await wechatSVC.exist();
    if (exist) {
        throw new ControllerError(ErrorCode.UnsupportedOperation);
    }

    const userInfo = await LoginWechat.getUserInfoAndToken(code, type);

    const userUUIDByDB = await ServiceUserWeChat.userUUIDByUnionUUID(userInfo.unionUUID);

    if (userUUIDByDB) {
        throw new ControllerError(ErrorCode.UserAlreadyBinding);
    }

    await wechatSVC.create(userInfo);
    await sensitiveSVC.wechatName({ name: userInfo.userName });
};

interface RequestType {
    querystring: {
        state: string;
        code: string;
    };
}
