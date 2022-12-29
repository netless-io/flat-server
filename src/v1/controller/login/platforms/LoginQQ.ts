import { LoginClassParams } from "abstract/login/Type";
import { AbstractLogin } from "../../../../abstract/login";
import { QQ } from "../../../../constants/Config";
import { Gender } from "../../../../constants/Project";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserQQ } from "../../../service/user/UserQQ";
import { ServiceCloudStorageFiles } from "../../../service/cloudStorage/CloudStorageFiles";
import { ServiceCloudStorageConfigs } from "../../../service/cloudStorage/CloudStorageConfigs";
import { ServiceCloudStorageUserFiles } from "../../../service/cloudStorage/CloudStorageUserFiles";
import { ax } from "../../../utils/Axios";

export class LoginQQ extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userQQ: new ServiceUserQQ(this.userUUID),
            cloudStorageFiles: new ServiceCloudStorageFiles(),
            cloudStorageConfigs: new ServiceCloudStorageConfigs(this.userUUID),
            cloudStorageUserFiles: new ServiceCloudStorageUserFiles(this.userUUID),
        };
    }

    public async register(info: RegisterInfo): Promise<void> {
        await dataSource.transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserWeChat = this.svc.userQQ.create(info, t);

            return await Promise.all([
                createUser,
                createUserWeChat,
                this.setGuidePPTX(this.svc, t),
            ]);
        });
    }

    public static async getUserInfoAndToken(
        code: string,
    ): Promise<RegisterInfo & { accessToken: string }> {
        const accessToken = await LoginQQ.getToken(code);
        const uuidInfo = await LoginQQ.getUUIDByAPI(accessToken);
        const userInfo = await LoginQQ.getUserInfoByAPI(accessToken, uuidInfo.openUUID);

        return {
            accessToken,
            ...uuidInfo,
            ...userInfo,
        };
    }

    public static async getToken(code: string): Promise<string> {
        const QQ_CALLBACK = "https://flat-web.whiteboard.agora.io/qq/callback";
        const response = await ax.get<AccessToken>(
            `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${QQ.appId}&client_secret=${QQ.appSecret}&code=${code}&redirect_uri=${QQ_CALLBACK}&fmt=json`,
        );

        return response.data.access_token;
    }

    public static async getUUIDByAPI(accessToken: string): Promise<QQUUIDInfo> {
        const response = await ax.get<QQUUIDResponse | RequestFailed>(
            `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}&unionid=1&fmt=json`,
        );

        if ("error" in response.data) {
            throw new Error(response.data.error);
        }

        return {
            openUUID: response.data.openid,
            unionUUID: response.data.unionid,
        };
    }

    public static async getUserInfoByAPI(
        accessToken: string,
        openUUID: string,
    ): Promise<QQUserInfo> {
        const response = await ax.get<QQUserResponse>(
            `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${QQ.appId}&openid=${openUUID}`,
        );

        const { nickname, figureurl_qq_1, gender } = response.data;

        return {
            userName: nickname,
            avatarURL: figureurl_qq_1,
            gender: gender === "男" ? Gender["Man"] : Gender["Woman"],
        };
    }
}

interface RegisterService {
    user: ServiceUser;
    userQQ: ServiceUserQQ;
    cloudStorageFiles: ServiceCloudStorageFiles;
    cloudStorageUserFiles: ServiceCloudStorageUserFiles;
    cloudStorageConfigs: ServiceCloudStorageConfigs;
}

interface RegisterInfo {
    userName: string;
    avatarURL: string;
    openUUID: string;
    unionUUID: string;
    gender: Gender;
}

interface AccessToken {
    readonly access_token: string;
}

interface QQUUIDResponse {
    readonly client_id: string;
    readonly openid: string;
    readonly unionid: string;
}

interface QQUUIDInfo {
    readonly openUUID: string;
    readonly unionUUID: string;
}

interface QQUserInfo {
    readonly userName: string;
    readonly avatarURL: string;
    readonly gender: Gender;
}

interface QQUserResponse {
    readonly nickname: string;
    readonly figureurl_qq_1: string;
    readonly gender: "男" | "女";
}

interface RequestFailed {
    readonly error: string;
    readonly error_description: string;
}
