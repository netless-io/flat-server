import { Login } from "../../../../decorator/Login";
import { AbstractLogin } from "../../../../abstract/login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserGoogle } from "../../../service/user/UserGoogle";
import { ax } from "../../../utils/Axios";
import { Google } from "../../../../constants/Config";
import { URLSearchParams } from "url";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { ServiceCloudStorageFiles } from "../../../service/cloudStorage/CloudStorageFiles";
import { ServiceCloudStorageConfigs } from "../../../service/cloudStorage/CloudStorageConfigs";
import { ServiceCloudStorageUserFiles } from "../../../service/cloudStorage/CloudStorageUserFiles";

@Login()
export class LoginGoogle extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userGoogle: new ServiceUserGoogle(this.userUUID),
            cloudStorageFiles: new ServiceCloudStorageFiles(),
            cloudStorageConfigs: new ServiceCloudStorageConfigs(this.userUUID),
            cloudStorageUserFiles: new ServiceCloudStorageUserFiles(this.userUUID),
        };
    }

    public async register(info: RegisterInfo): Promise<void> {
        await dataSource.transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserGoogle = this.svc.userGoogle.create(info, t);

            return await Promise.all([
                createUser,
                createUserGoogle,
                this.setGuidePPTX(this.svc, t),
            ]);
        });
    }

    public static async getToken(
        route: keyof typeof Google.redirectURI,
        code: string,
    ): Promise<string> {
        const response = await ax.post<AccessToken>(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: Google.clientId,
                client_secret: Google.clientSecret,
                redirect_uri: Google.redirectURI[route],
                grant_type: "authorization_code",
            }),
        );

        const { access_token, token_type } = response.data;

        return `${token_type} ${access_token}`;
    }

    public static async getUserInfoByAPI(authorization: string): Promise<GoogleUserInfo> {
        const response = await ax.get<GoogleUserResponse>(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: authorization,
                },
            },
        );

        const { id, picture, given_name } = response.data;

        return {
            unionUUID: id,
            avatarURL: picture,
            userName: given_name,
        };
    }

    public static async getUserInfoAndToken(
        route: keyof typeof Google.redirectURI,
        code: string,
    ): Promise<GoogleUserInfo & { accessToken: string }> {
        const accessToken = await LoginGoogle.getToken(route, code);
        const userInfo = await LoginGoogle.getUserInfoByAPI(accessToken);

        return {
            ...userInfo,
            accessToken,
        };
    }
}

interface RegisterService {
    user: ServiceUser;
    userGoogle: ServiceUserGoogle;
    cloudStorageFiles: ServiceCloudStorageFiles;
    cloudStorageUserFiles: ServiceCloudStorageUserFiles;
    cloudStorageConfigs: ServiceCloudStorageConfigs;
}

interface RegisterInfo {
    userName: string;
    avatarURL: string;
    unionUUID: string;
}

interface AccessToken {
    token_type: string;
    access_token: string;
}

type GoogleUserInfo = RegisterInfo;

interface GoogleUserResponse {
    id: string;
    picture: string;
    given_name: string;
}
