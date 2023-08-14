import { FastifySchema, ResponseError } from "../../../../types/Server";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { v4 } from "uuid";
import { LoginPlatform } from "../../../../constants/Project";
import { parseError } from "../../../../logger";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { LoginAgora } from "../platforms/LoginAgora";
import { ServiceUserAgora } from "../../../service/user/UserAgora";
import { AgoraLogin, Website } from "../../../../constants/Config";
import { generateAvatar } from "../../../../utils/Avatar";

@Controller<RequestType, any>({
    method: "get",
    path: "login/agora/callback",
    auth: false,
    skipAutoHandle: true,
    enable: AgoraLogin.enable,
})
export class AgoraCallback extends AbstractController<RequestType> {
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

        await LoginAgora.assertHasAuthUUID(authUUID, this.logger);

        const userInfo = await LoginAgora.getUserInfo(code);

        const userUUIDByDB = await ServiceUserAgora.userUUIDByUnionUUID(userInfo.unionUUID);

        const userUUID = userUUIDByDB || v4();

        const loginAgora = new LoginAgora({
            userUUID,
        });

        if (!userUUIDByDB) {
            await loginAgora.register({
                ...userInfo,
                userName: userInfo.userName || "Agora User",
                // apple does not provide the user's avatar information, so the default avatar is used here
                avatarURL: generateAvatar(userUUID),
            });
        }

        const token = await this.reply.jwtSign({
            userUUID,
            loginSource: LoginPlatform.Agora,
        });

        void this.reply.redirect(`${Website}/login?token=${token}`);
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        await redisService.set(RedisKey.authFailed(this.querystring.state), error.message, 60 * 60);

        this.logger.error("request failed", parseError(error));

        void this.reply.headers({
            "content-type": "text/html",
        });
        return this.reply.send(AgoraCallback.failedHTML);
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
                    <path d="M40 0c22.0914 0 40 17.9086 40 40S62.0914 80 40 80 0 62.0914 0 40 17.9086 0 40 0zm0 4C20.1177 4 4 20.1177 4 40s16.1177 36 36 36 36-16.1177 36-36S59.8823 4 40 4zm21.0572 49.2345l.357.3513-2.8284 2.8284c-10.162-10.162-26.5747-10.2636-36.8617-.3048l-.3099.3048-2.8284-2.8284c11.7085-11.7085 30.619-11.8256 42.4714-.3513zM27 26c2.2091 0 4 1.7909 4 4 0 2.2091-1.7909 4-4 4-2.2091 0-4-1.7909-4-4 0-2.2091 1.7909-4 4-4zm26 0c2.2091 0 4 1.7909 4 4 0 2.2091-1.7909 4-4 4-2.2091 0-4-1.7909-4-4 0-2.2091 1.7909-4 4-4z" fill="#F45454" fill-rule="nonzero" />
                </svg>
                <div id="text" style=position:fixed;top:60%;left:50%;transform:translate(-50%,-50%)>Login Failed. After 3s it will automatically jump to the home page</div>
            <script>
                if (navigator.language.startsWith("zh")) {
                    document.getElementById("text").textContent = "登录失败，3秒后将自动跳转到首页"
                }

                setTimeout(() => {
                  location.href = "${Website}";
                }, 3000);
            </script>
            </body>
            </html>
        `;
    }
}

interface RequestType {
    querystring: {
        state: string;
        code: string;
    };
}
