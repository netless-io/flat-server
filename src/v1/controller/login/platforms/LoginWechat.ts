import { AbstractLogin } from "../../../../abstract/login";
import { Login } from "../../../../decorator/Login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ax } from "../../../utils/Axios";
import { WeChat } from "../../../../constants/Config";
import { AxiosResponse } from "axios";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";
import { ServiceCloudStorageFiles } from "../../../service/cloudStorage/CloudStorageFiles";
import { ServiceCloudStorageConfigs } from "../../../service/cloudStorage/CloudStorageConfigs";
import { ServiceCloudStorageUserFiles } from "../../../service/cloudStorage/CloudStorageUserFiles";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { ServiceUserSensitive } from "../../../service/user/UserSensitive";

@Login()
export class LoginWechat extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userWeChat: new ServiceUserWeChat(this.userUUID),
            userSensitive: new ServiceUserSensitive(this.userUUID),
            cloudStorageFiles: new ServiceCloudStorageFiles(),
            cloudStorageConfigs: new ServiceCloudStorageConfigs(this.userUUID),
            cloudStorageUserFiles: new ServiceCloudStorageUserFiles(this.userUUID),
        };
    }

    public async register(info: RegisterInfo): Promise<void> {
        await dataSource.transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserWeChat = this.svc.userWeChat.create(info, t);
            const createUserSensitive = this.svc.userSensitive.wechatName({ name: info.userName }, t);

            return await Promise.all([
                createUser,
                createUserWeChat,
                createUserSensitive,
                this.setGuidePPTX(this.svc, t),
            ]);
        });
    }

    public static async getToken(code: string, type: "WEB" | "MOBILE"): Promise<WeChatToken> {
        const t = type.toLowerCase() as Lowercase<keyof typeof WeChat>;
        const result = await LoginWechat.wechatRequest<WeChatResponseToken>(
            `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WeChat[t].appId}&secret=${WeChat[t].appSecret}&code=${code}&grant_type=authorization_code`,
        );
        return {
            accessToken: result.access_token,
            openUUID: result.openid,
        };
    }

    public static async getUserInfoByAPI(params: {
        accessToken: string;
        openUUID: string;
    }): Promise<WeChatUserInfo> {
        const result = await LoginWechat.wechatRequest<WeChatResponseUserInfo>(
            `https://api.weixin.qq.com/sns/userinfo?access_token=${params.accessToken}&openid=${params.openUUID}`,
        );

        return {
            unionUUID: result.unionid,
            avatarURL: result.headimgurl,
            userName: result.nickname,
        };
    }

    public static async getUserInfoAndToken(
        code: string,
        type: "WEB" | "MOBILE",
    ): Promise<WeChatUserInfo & WeChatToken> {
        const token = await LoginWechat.getToken(code, type);
        const userInfo = await LoginWechat.getUserInfoByAPI(token);

        return {
            ...userInfo,
            ...token,
        };
    }

    private static async wechatRequest<T extends {}>(url: string): Promise<T> {
        const response: AxiosResponse<T | WeChatRequestFailed> = await ax.get(url);

        if ("errmsg" in response.data) {
            throw new Error(response.data.errmsg);
        }

        return response.data;
    }
}

interface RegisterService {
    user: ServiceUser;
    userWeChat: ServiceUserWeChat;
    userSensitive: ServiceUserSensitive,
    cloudStorageFiles: ServiceCloudStorageFiles;
    cloudStorageUserFiles: ServiceCloudStorageUserFiles;
    cloudStorageConfigs: ServiceCloudStorageConfigs;
}

interface RegisterInfo {
    userName: string;
    avatarURL: string;
    unionUUID: string;
    openUUID: string;
}

interface WeChatResponseToken {
    readonly access_token: string;
    readonly expires_in: string;
    readonly openid: string;
    readonly scope: string;
}

interface WeChatToken {
    accessToken: string;
    openUUID: string;
}

interface WeChatResponseUserInfo {
    readonly openid: string;
    readonly nickname: string;
    readonly sex: 1 | 2;
    readonly province: string;
    readonly city: string;
    readonly country: string;
    readonly headimgurl: string;
    readonly privilege: string[];
    readonly unionid: string;
}

interface WeChatUserInfo {
    readonly unionUUID: string;
    readonly userName: string;
    readonly avatarURL: string;
}

interface WeChatRequestFailed {
    readonly errcode: number;
    readonly errmsg: string;
}
