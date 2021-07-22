import { AbstractLogin } from "../../../../abstract/login";
import { Login } from "../../../../decorator/Login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ax } from "../../../utils/Axios";
import { Github } from "../../../../constants/Process";
import { getConnection } from "typeorm";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserGithub } from "../../../service/user/UserGithub";

@Login()
export class LoginGithub extends AbstractLogin {
    private readonly svc: RegisterService;

    constructor(
        params: LoginClassParams<{
            svc: RegisterService;
        }>,
    ) {
        super(params);
        this.svc = params.svc;
    }

    public static assertCallbackParamsNoError(query: Record<string, any>): void {
        if ("error" in query) {
            throw new Error("callback query params did not pass the github check");
        }
    }

    public async register(info: RegisterInfo): Promise<void> {
        await getConnection().transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserGithub = this.svc.userGithub.create(info, t);

            return await Promise.all([createUser, createUserGithub]);
        });
    }

    public static async getToken(code: string, authUUID: string): Promise<string> {
        const response = await ax.post<AccessToken | RequestFailed>(
            `https://github.com/login/oauth/access_token?client_id=${Github.CLIENT_ID}&client_secret=${Github.CLIENT_SECRET}&code=${code}&state=${authUUID}`,
            null,
            {
                headers: {
                    accept: "application/json",
                },
            },
        );

        if ("error" in response.data) {
            throw new Error(response.data.error);
        }

        return response.data.access_token;
    }

    public static async getUserInfoByAPI(accessToken: string): Promise<GithubUserInfo> {
        const response = await ax.get<GithubUserResponse | RequestFailed>(
            "https://api.github.com/user",
            {
                headers: {
                    accept: "application/json",
                    Authorization: `token ${accessToken}`,
                },
            },
        );

        if ("error" in response.data) {
            throw new Error(response.data.error);
        }

        const { id, login, avatar_url } = response.data;

        return {
            unionUUID: String(id),
            userName: login,
            avatarURL: avatar_url,
        };
    }

    public static async getUserInfoAndToken(
        code: string,
        authUUID: string,
    ): Promise<GithubUserInfo & { accessToken: string }> {
        const accessToken = await LoginGithub.getToken(code, authUUID);
        const userInfo = await LoginGithub.getUserInfoByAPI(accessToken);

        return {
            ...userInfo,
            accessToken,
        };
    }

    public static successHTML(needLaunchApp: boolean): string {
        const launchAppCode = needLaunchApp
            ? `setTimeout(() => {
                    location.href = "x-agora-flat-client://open"
                }, 1000 * 3)`
            : "";

        return `
        <!doctype html>
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
        </html>`;
    }

    public static get failedHTML(): string {
        return `
        <!doctype html>
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
        </html>`;
    }
}

interface RegisterService {
    user: ServiceUser;
    userGithub: ServiceUserGithub;
}

interface RegisterInfo {
    userName: string;
    avatarURL: string;
    unionUUID: string;
    accessToken: string;
}

interface AccessToken {
    access_token: string;
}

interface GithubUserResponse {
    id: number;
    avatar_url: string;
    login: string;
}

interface GithubUserInfo {
    unionUUID: string;
    avatarURL: string;
    userName: string;
}

interface RequestFailed {
    error: string;
    error_description: string;
}
