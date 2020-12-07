import { Wechat } from "../../Constants";

export const getAccessTokenURL = (code: string): string => {
    return `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${Wechat.APP_ID}&secret=${Wechat.APP_SECRET}&code=${code}&grant_type=authorization_code`;
};

export const getUserInfoURL = (accessToken: string, openid: string): string => {
    return `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}`;
};

export const renewAccessToken = (refreshToken: string): string => {
    return `https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${Wechat.APP_ID}&grant_type=refresh_token&refresh_token=${refreshToken}`;
};
