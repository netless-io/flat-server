import { AbstractLogin } from "../../../../abstract/login";
import { Login } from "../../../../decorator/Login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ax } from "../../../utils/Axios";
import { Github } from "../../../../constants/Process";
import { getConnection } from "typeorm";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserGithub } from "../../../service/user/UserGithub";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";

@Login()
export class LoginGithub extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userGithub: new ServiceUserGithub(this.userUUID),
        };
    }

    public async register(info: RegisterInfo): Promise<void> {
        await getConnection().transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserGithub = this.svc.userGithub.create(info, t);

            return await Promise.all([createUser, createUserGithub]);
        });
    }

    public async saveToken(token: string): Promise<void> {
        await redisService.set(RedisKey.githubAccessToken(this.userUUID), token);
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
