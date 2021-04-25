import { AxiosResponse } from "axios";
import { ax } from "../../Axios";
import { WeChat } from "../../../../constants/Process";

const wechatRequest = async <T>(url: string): Promise<T> => {
    const response: AxiosResponse<T | WeChatRequestFailed> = await ax.get(url);

    if ("errmsg" in response.data) {
        throw new Error(response.data.errmsg);
    }

    return response.data;
};

export const getWeChatAccessToken = (
    code: string,
    type: "WEB" | "MOBILE",
): Promise<AccessToken> => {
    return wechatRequest<AccessToken>(
        `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WeChat[type].APP_ID}&secret=${WeChat[type].APP_SECRET}&code=${code}&grant_type=authorization_code`,
    );
};

export const weChatRenewAccessToken = (
    refreshToken: string,
    type: "WEB" | "MOBILE",
): Promise<RefreshToken> => {
    return wechatRequest<RefreshToken>(
        `https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${WeChat[type].APP_ID}&grant_type=refresh_token&refresh_token=${refreshToken}`,
    );
};

export const getWeChatUserInfo = (accessToken: string, openid: string): Promise<UserInfo> => {
    return wechatRequest<UserInfo>(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}`,
    );
};

interface AccessToken {
    readonly access_token: string;
    readonly expires_in: string;
    readonly refresh_token: string;
    readonly openid: string;
    readonly scope: string;
}

interface RefreshToken {
    access_token: string;
    expires_in: number;
    refresh_token: number;
    openid: string;
    scope: string;
}

interface UserInfo {
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

interface WeChatRequestFailed {
    readonly errcode: number;
    readonly errmsg: string;
}
