import { AbstractLogin } from "../../../../abstract/login";
import { Login } from "../../../../decorator/Login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ax } from "../../../utils/Axios";
import { WeChat } from "../../../../constants/Process";
import { getConnection } from "typeorm";
import { AxiosResponse } from "axios";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";

@Login()
export class LoginWechat extends AbstractLogin {
    private readonly svc: RegisterService;

    constructor(
        params: LoginClassParams<{
            svc: RegisterService;
        }>,
    ) {
        super(params);
        this.svc = params.svc;
    }

    public async register(info: RegisterInfo): Promise<void> {
        await getConnection().transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserGithub = this.svc.userWeChat.create(info, t);

            return await Promise.all([createUser, createUserGithub]);
        });
    }

    public static async getToken(code: string, type: "WEB" | "MOBILE"): Promise<WeChatToken> {
        const result = await LoginWechat.wechatRequest<WeChatResponseToken>(
            `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WeChat[type].APP_ID}&secret=${WeChat[type].APP_SECRET}&code=${code}&grant_type=authorization_code`,
        );

        return {
            accessToken: result.access_token,
            openUUID: result.openid,
            refreshToken: result.refresh_token,
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

    private static async wechatRequest<T>(url: string): Promise<T> {
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
    readonly refresh_token: string;
    readonly openid: string;
    readonly scope: string;
}

interface WeChatToken {
    accessToken: string;
    openUUID: string;
    refreshToken: string;
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