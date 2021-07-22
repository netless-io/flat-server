import { FastifySchema, ResponseError } from "../../../../types/Server";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { v4 } from "uuid";
import { LoginPlatform } from "../../../../constants/Project";
import { parseError } from "../../../../logger";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { LoginGithub } from "../platforms/LoginGithub";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserGithub } from "../../../service/user/UserGithub";

@Controller<RequestType, any>({
    method: "get",
    path: "login/github/callback",
    auth: false,
    skipAutoHandle: true,
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

        LoginGithub.assertCallbackParamsNoError(this.querystring);

        await LoginGithub.assertHasAuthUUID(authUUID, this.logger);

        const userInfo = await LoginGithub.getUserInfoAndToken(code, authUUID);

        const basicUUIDInfo = await ServiceUserGithub.basicUUIDInfoByUnionUUID(userInfo.unionUUID);

        const userUUID = basicUUIDInfo?.userUUID || v4();

        const svc = {
            user: new ServiceUser(userUUID),
            userGithub: new ServiceUserGithub(userUUID),
        };

        const loginGithub = new LoginGithub({
            userUUID,
            svc,
        });

        const { userName, avatarURL } = await (async () => {
            if (!basicUUIDInfo) {
                await loginGithub.register(userInfo);
                return userInfo;
            }

            if (basicUUIDInfo.accessToken !== userInfo.accessToken) {
                this.logger.info("github user modified access token");
                await svc.userGithub.updateAccessToken(userInfo.accessToken);
            }

            return (await svc.user.getNameAndAvatar())!;
        })();

        await loginGithub.tempSaveUserInfo(authUUID, {
            name: userName,
            token: await this.reply.jwtSign({
                userUUID,
                loginSource: LoginPlatform.Github,
            }),
            avatar: avatarURL,
        });

        return this.reply.send(LoginGithub.successHTML(platform !== "web"));
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        const failedReason = this.querystring.error || "";
        await redisService.set(RedisKey.authFailed(this.querystring.state), failedReason, 60 * 60);

        this.logger.error("request failed", parseError(error));
        return this.reply.send(LoginGithub.failedHTML);
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
