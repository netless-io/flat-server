import { AbstractLogin } from "../../../../abstract/login";
import { Login } from "../../../../decorator/Login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ax } from "../../../utils/Axios";
import { Github } from "../../../../constants/Config";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserGithub } from "../../../service/user/UserGithub";
import { ServiceCloudStorageFiles } from "../../../service/cloudStorage/CloudStorageFiles";
import { ServiceCloudStorageUserFiles } from "../../../service/cloudStorage/CloudStorageUserFiles";
import { ServiceCloudStorageConfigs } from "../../../service/cloudStorage/CloudStorageConfigs";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

@Login()
export class LoginGithub extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userGithub: new ServiceUserGithub(this.userUUID),
            cloudStorageFiles: new ServiceCloudStorageFiles(),
            cloudStorageConfigs: new ServiceCloudStorageConfigs(this.userUUID),
            cloudStorageUserFiles: new ServiceCloudStorageUserFiles(this.userUUID),
        };
    }

    public async register(info: RegisterInfo): Promise<void> {
        await dataSource.transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserGithub = this.svc.userGithub.create(info, t);

            return await Promise.all([
                createUser,
                createUserGithub,
                this.setGuidePPTX(this.svc, t),
            ]);
        });
    }

    public static async getToken(code: string, authUUID: string): Promise<string> {
        const response = await ax.post<AccessToken | RequestFailed>(
            `https://github.com/login/oauth/access_token?client_id=${Github.clientId}&client_secret=${Github.clientSecret}&code=${code}&state=${authUUID}`,
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
    cloudStorageFiles: ServiceCloudStorageFiles;
    cloudStorageUserFiles: ServiceCloudStorageUserFiles;
    cloudStorageConfigs: ServiceCloudStorageConfigs;
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
