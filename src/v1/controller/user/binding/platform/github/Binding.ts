import { Controller } from "../../../../../../decorator/Controller";
import { Github } from "../../../../../../constants/Config";
import { AbstractController } from "../../../../../../abstract/controller";
import { FastifySchema, ResponseError } from "../../../../../../types/Server";
import RedisService from "../../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../../utils/Redis";
import { ControllerError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";
import { failedHTML, successHTML } from "../../../../login/utils/callbackHTML";
import { LoginGithub } from "../../../../login/platforms/LoginGithub";
import { ServiceUserGithub } from "../../../../../service/user/UserGithub";
import { parseError } from "../../../../../../logger";

@Controller<RequestType, any>({
    method: "get",
    path: ["user/binding/platform/github", "login/github/callback/binding"],
    auth: false,
    skipAutoHandle: true,
    enable: Github.enable,
})
export class BindingGithub extends AbstractController<RequestType, any> {
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
                error: {
                    type: "string",
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<void> {
        void this.reply.headers({
            "content-type": "text/html",
        });

        const { state: authUUID, code } = this.querystring;

        BindingGithub.assertCallbackParamsNoError(this.querystring);

        const userUUID = await RedisService.get(RedisKey.bindingAuthUUID(authUUID));
        if (userUUID === null) {
            this.logger.warn("uuid verification failed");
            throw new ControllerError(ErrorCode.ParamsCheckFailed);
        }

        const githubSVC = new ServiceUserGithub(userUUID);

        const exist = await githubSVC.exist();
        if (exist) {
            throw new ControllerError(ErrorCode.UnsupportedOperation);
        }

        const userInfo = await LoginGithub.getUserInfoAndToken(code, authUUID);
        const userUUIDByDB = await ServiceUserGithub.userUUIDByUnionUUID(userInfo.unionUUID);
        if (userUUIDByDB) {
            throw new ControllerError(ErrorCode.UserAlreadyBinding);
        }

        await githubSVC.create(userInfo);

        await RedisService.set(RedisKey.bindingAuthStatus(this.querystring.state), "true", 60 * 60);

        return this.reply.send(successHTML(this.querystring.platform !== "web", true));
    }

    private static assertCallbackParamsNoError(querystring: RequestType["querystring"]): void {
        if (querystring.error) {
            throw new Error("callback query params did not pass the github check");
        }
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
        error?: string;
        platform?: string;
    };
}
