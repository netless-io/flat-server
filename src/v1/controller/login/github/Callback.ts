import { FastifySchema, ResponseError } from "../../../../types/Server";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { v4 } from "uuid";
import { LoginPlatform } from "../../../../constants/Project";
import { parseError } from "../../../../logger";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { LoginGithub } from "../platforms/LoginGithub";
import { ServiceUserGithub } from "../../../service/user/UserGithub";
import { Github } from "../../../../constants/Config";
import { failedHTML, successHTML } from "../utils/callbackHTML";

@Controller<RequestType, any>({
    method: "get",
    path: "login/github/callback",
    auth: false,
    skipAutoHandle: true,
    enable: Github.enable,
})
export class GithubCallback extends AbstractController<RequestType> {
    public static readonly schema: FastifySchema<RequestType> = {
        querystring: {
            type: "object",
            required: ["state"],
            properties: {
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
                platform: {
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

        const { state: authUUID, platform, code } = this.querystring;

        GithubCallback.assertCallbackParamsNoError(this.querystring);

        await LoginGithub.assertHasAuthUUID(authUUID, this.logger);

        const userInfo = await LoginGithub.getUserInfoAndToken(code, authUUID);

        const userUUIDByDB = await ServiceUserGithub.userUUIDByUnionUUID(userInfo.unionUUID);

        const userUUID = userUUIDByDB || v4();

        const loginGithub = new LoginGithub({
            userUUID,
        });

        if (!userUUIDByDB) {
            await loginGithub.register(userInfo);
        }

        const { userName, avatarURL } = !userUUIDByDB
            ? userInfo
            : (await loginGithub.svc.user.nameAndAvatar())!;

        await loginGithub.tempSaveUserInfo(authUUID, {
            name: userName,
            token: await this.reply.jwtSign({
                userUUID,
                loginSource: LoginPlatform.Github,
            }),
            avatar: avatarURL,
        });

        return this.reply.send(successHTML(platform !== "web"));
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        const failedReason = this.querystring.error || "";
        await redisService.set(RedisKey.authFailed(this.querystring.state), failedReason, 60 * 60);

        this.logger.error("request failed", parseError(error));
        return this.reply.send(failedHTML());
    }

    private static assertCallbackParamsNoError(querystring: RequestType["querystring"]): void {
        if (querystring.error) {
            throw new Error("callback query params did not pass the github check");
        }
    }
}

interface RequestType {
    querystring: {
        state: string;
        platform?: "web";
        code: string;
        error?: string;
    };
}
