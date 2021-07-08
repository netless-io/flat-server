import { FastifySchema, ResponseError } from "../../../../types/Server";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import {
    getGithubAccessToken,
    getGithubUserInfo,
} from "../../../utils/request/github/GithubRequest";
import { UserDAO, UserGithubDAO } from "../../../../dao";
import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { LoginPlatform } from "../../../../constants/Project";
import { parseError } from "../../../../logger";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";

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
                },
                platform: {
                    type: "string",
                    nullable: true,
                },
            },
            oneOf: [
                {
                    required: ["code"],
                },
                {
                    required: ["error"],
                },
            ],
        },
    };

    public async execute(): Promise<void> {
        void this.reply.headers({
            "content-type": "text/html",
        });

        const { state: authUUID, platform } = this.querystring;

        if ("error" in this.querystring) {
            await redisService.set(RedisKey.authFailed(authUUID), this.querystring.error, 60 * 60);

            return this.reply.send(failedHTML);
        }

        const code = this.querystring.code;

        const checkAuthUUID = await redisService.get(RedisKey.authUUID(authUUID));

        if (checkAuthUUID === null) {
            this.logger.warn("uuid verification failed");

            await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);

            return this.reply.send(failedHTML);
        }

        const accessToken = await getGithubAccessToken(code, authUUID);

        const { id: union_uuid, avatar_url, login: user_name } = await getGithubUserInfo(
            accessToken,
        );

        const getUserInfoByUserGithub = await UserGithubDAO().findOne(
            ["user_uuid", "user_name", "access_token"],
            {
                union_uuid: String(union_uuid),
            },
        );

        let userUUID = getUserInfoByUserGithub?.user_uuid || "";
        if (getUserInfoByUserGithub === undefined) {
            userUUID = v4();

            await getConnection().transaction(async t => {
                const createUser = UserDAO(t).insert({
                    user_name,
                    user_uuid: userUUID,
                    // TODO need upload avatar_url to remote oss server
                    avatar_url,
                    user_password: "",
                });

                const createUserGithub = UserGithubDAO(t).insert({
                    user_uuid: userUUID,
                    union_uuid: String(union_uuid),
                    access_token: accessToken,
                    user_name,
                });

                return await Promise.all([createUser, createUserGithub]);
            });
        } else {
            if (getUserInfoByUserGithub.access_token !== accessToken) {
                this.logger.info("github user modified access token");
                await UserGithubDAO().update(
                    {
                        access_token: accessToken,
                    },
                    {
                        user_uuid: userUUID,
                    },
                );
            }
        }

        const getUserInfoByUser = await UserDAO().findOne(["user_name", "avatar_url"], {
            user_uuid: userUUID,
        });

        const { user_name: name, avatar_url: avatar } = getUserInfoByUser!;

        const token = await this.reply.jwtSign({
            userUUID,
            loginSource: LoginPlatform.Github,
        });

        await redisService.set(
            RedisKey.authUserInfo(authUUID),
            JSON.stringify({
                name: name,
                avatar: avatar,
                userUUID,
                token,
            }),
            60 * 60,
        );

        return this.reply.send(successHTML(platform !== "web"));
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        await redisService.set(RedisKey.authFailed(this.querystring.state), "", 60 * 60);
        this.logger.error("request failed", parseError(error));
        return this.reply.send(failedHTML);
    }
}

const successHTML = (needLaunchApp: boolean): string => {
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
        <path d="M40 0c22.0914 0 40 17.9086 40 40S62.0914 80 40 80 0 62.0914 0 40 17.9086 0 40 0zm0 4C20.1177 4 4 20.1177 4 40s16.1177 36 36 36 36-16.1177 36-36S59.8823 4 40 4zm22.6337 20.5395l2.7326 2.921-32.3889 30.2993L14.61 40.0046l2.78-2.876L33.022 52.24l29.6117-27.7005z" fill=#9FDF76 fill-rule=nonzero />
    </svg>
    <div id=text style=position:fixed;top:60%;left:50%;transform:translate(-50%,-50%)>Login Success</div>
</body>
<script>
    if (navigator.language.startsWith("zh")) {
        document.getElementById("text").textContent = "登录成功"
    }

    ${launchAppCode}
</script>
</html>
`;
};

const failedHTML = `<!doctype html>
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

interface RequestType {
    querystring: {
        state: string;
        platform?: "web";
    } & (
        | {
              code: string;
          }
        | {
              error: string;
          }
    );
}
