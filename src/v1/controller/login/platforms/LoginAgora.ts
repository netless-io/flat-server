import { AbstractLogin } from "../../../../abstract/login";
import { Login } from "../../../../decorator/Login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ServiceUser } from "../../../service/user/User";
import { ServiceCloudStorageFiles } from "../../../service/cloudStorage/CloudStorageFiles";
import { ServiceCloudStorageConfigs } from "../../../service/cloudStorage/CloudStorageConfigs";
import { ServiceCloudStorageUserFiles } from "../../../service/cloudStorage/CloudStorageUserFiles";
import { ServiceUserAgora } from "../../../service/user/UserAgora";
import { ax } from "../../../utils/Axios";
import { AgoraLogin } from "../../../../constants/Config";
import { stringify } from "qs";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

@Login()
export class LoginAgora extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userAgora: new ServiceUserAgora(this.userUUID),
            cloudStorageFiles: new ServiceCloudStorageFiles(),
            cloudStorageConfigs: new ServiceCloudStorageConfigs(this.userUUID),
            cloudStorageUserFiles: new ServiceCloudStorageUserFiles(this.userUUID),
        };
    }

    public async register(info: RegisterInfo): Promise<void> {
        await dataSource.transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserAgora = this.svc.userAgora.create(info, t);

            return await Promise.all([createUser, createUserAgora, this.setGuidePPTX(this.svc, t)]);
        });
    }

    public static async getToken(code: string): Promise<AgoraToken> {
        const result = await ax.post<AgoraResponseToken>(
            "https://sso2.agora.io/api/v0/oauth/token",
            stringify({
                client_id: AgoraLogin.clientId,
                client_secret: AgoraLogin.clientSecret,
                grant_type: "authorization_code",
                code,
                redirect_uri: "",
            }),
        );

        return {
            accessToken: result.data.access_token,
        };
    }

    public static async getUserInfoByAPI(token: AgoraToken): Promise<AgoraUserInfo> {
        const result = await ax.get<AgoraLoginResponseUserInfo>(
            "https://sso-open.agora.io/api/v0/customer/company/basic-info",
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                },
            },
        );

        return {
            unionUUID: result.data.accountUid,
            userName: result.data.displayName,
        };
    }

    public static async getUserInfo(code: string): Promise<AgoraUserInfo> {
        const token = await LoginAgora.getToken(code);
        return await LoginAgora.getUserInfoByAPI(token);
    }
}

interface RegisterService {
    user: ServiceUser;
    userAgora: ServiceUserAgora;
    cloudStorageFiles: ServiceCloudStorageFiles;
    cloudStorageUserFiles: ServiceCloudStorageUserFiles;
    cloudStorageConfigs: ServiceCloudStorageConfigs;
}

interface RegisterInfo {
    userName: string;
    avatarURL: string;
    unionUUID: string;
}

interface AgoraResponseToken {
    readonly access_token: string;
}

interface AgoraToken {
    accessToken: string;
}

interface AgoraLoginResponseUserInfo {
    readonly accountUid: string;
    readonly displayName: string;
}

interface AgoraUserInfo {
    readonly unionUUID: string;
    readonly userName: string;
}
