import { Controller } from "../../../../../../decorator/Controller";
import { Google } from "../../../../../../constants/Config";
import { AbstractController } from "../../../../../../abstract/controller";
import { FastifySchema, ResponseError } from "../../../../../../types/Server";
import RedisService from "../../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../../utils/Redis";
import { ControllerError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";
import { failedHTML, successHTML } from "../../../../login/utils/callbackHTML";
import { parseError } from "../../../../../../logger";
import { ServiceUserGoogle } from "../../../../../service/user/UserGoogle";
import { LoginGoogle } from "../../../../login/platforms/LoginGoogle";

@Controller<RequestType, any>({
    method: "get",
    path: "user/binding/platform/google",
    auth: false,
    skipAutoHandle: true,
    enable: Google.enable,
})
export class BindingGoogle extends AbstractController<RequestType, any> {
    public static readonly schema: FastifySchema<RequestType> = {
        querystring: {
            type: "object",
            required: ["state"],
            properties: {
                platform: {
                    type: "string",
                    nullable: true,
                },
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

        const { state: authUUID, code } = this.querystring;

        const userUUID = await RedisService.get(RedisKey.bindingAuthUUID(authUUID));
        if (userUUID === null) {
            this.logger.warn("uuid verification failed");
            throw new ControllerError(ErrorCode.ParamsCheckFailed);
        }

        const googleSVC = new ServiceUserGoogle(userUUID);

        const exist = await googleSVC.exist();
        if (exist) {
            throw new ControllerError(ErrorCode.UnsupportedOperation);
        }

        const userInfo = await LoginGoogle.getUserInfoAndToken("bind", code);
        const userUUIDByDB = await ServiceUserGoogle.userUUIDByUnionUUID(userInfo.unionUUID);
        if (userUUIDByDB) {
            throw new ControllerError(ErrorCode.UserAlreadyBinding);
        }

        await googleSVC.create(userInfo);

        await RedisService.set(RedisKey.bindingAuthStatus(this.querystring.state), "true", 60 * 60);

        return this.reply.send(successHTML(this.querystring.platform !== "web", true));
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        await RedisService.set(
            RedisKey.bindingAuthStatus(this.querystring.state),
            "false",
            60 * 60,
        );

        this.logger.error("request failed", parseError(error));
        return this.reply.send(failedHTML(true));
    }
}

interface RequestType {
    querystring: {
        state: string;
        code: string;
        platform?: string;
    };
}
