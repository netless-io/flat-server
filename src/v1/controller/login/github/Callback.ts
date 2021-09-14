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

        return this.reply.send(GithubCallback.successHTML(platform !== "web"));
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        const failedReason = this.querystring.error || "";
        await redisService.set(RedisKey.authFailed(this.querystring.state), failedReason, 60 * 60);

        this.logger.error("request failed", parseError(error));
        return this.reply.send(GithubCallback.failedHTML);
    }

    private static assertCallbackParamsNoError(querystring: RequestType["querystring"]): void {
        if (querystring.error) {
            throw new Error("callback query params did not pass the github check");
        }
    }

    private static successHTML(needLaunchApp: boolean): string {
        const launchAppCode = needLaunchApp
            ? `setTimeout(() => {
            location.href = "x-agora-flat-client://open"
        }, 1000 * 3)`
            : "";

        return `<!doctype html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Login Success</title>
            </head>
            <body>
                <svg style=max-width:80px;max-height:80px;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 0c22.0914 0 40 17.9086 40 40S62.0914 80 40 80 0 62.0914 0 40 17.9086 0 40 0zm0 4C20.1177 4 4 20.1177 4 40s16.1177 36 36 36 36-16.1177 36-36S59.8823 4 40 4zm22.6337 20.5395l2.7326 2.921-32.3889 30.2993L14.61 40.0046l2.78-2.876L33.022 52.24l29.6117-27.7005z" fill="#9FDF76" fill-rule="nonzero" />
                </svg>
                <div id="text" style=position:fixed;top:60%;left:50%;transform:translate(-50%,-50%)>Login Success</div>
            </body>
            <script>
                if (navigator.language.startsWith("zh")) {
                    document.getElementById("text").textContent = "登录成功"
                }

                ${launchAppCode}
            </script>
            </html>
        `;
    }
    private static get failedHTML(): string {
        return `<!doctype html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Login Failed</title>
            </head>
            <body>
                <svg style=max-width:80px;max-height:80px;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 0c22.0914 0 40 17.9086 40 40S62.0914 80 40 80 0 62.0914 0 40 17.9086 0 40 0zm0 4C20.1177 4 4 20.1177 4 40s16.1177 36 36 36 36-16.1177 36-36S59.8823 4 40 4zm21.0572 49.2345l.357.3513-2.8284 2.8284c-10.162-10.162-26.5747-10.2636-36.8617-.3048l-.3099.3048-2.8284-2.8284c11.7085-11.7085 30.619-11.8256 42.4714-.3513zM27 26c2.2091 0 4 1.7909 4 4 0 2.2091-1.7909 4-4 4-2.2091 0-4-1.7909-4-4 0-2.2091 1.7909-4 4-4zm26 0c2.2091 0 4 1.7909 4 4 0 2.2091-1.7909 4-4 4-2.2091 0-4-1.7909-4-4 0-2.2091 1.7909-4 4-4z" fill=#F45454 fill-rule=nonzero />
                </svg>
                <div id=text style=position:fixed;top:60%;left:50%;transform:translate(-50%,-50%)>Login Failed</div>
            <script>
                if (navigator.language.startsWith("zh")) {
                    document.getElementById("text").textContent = "登录失败"
                }
            </script>
            </body>
            </html>
        `;
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
