export interface AccessToken {
    readonly access_token: string;
    readonly expires_in: string;
    readonly refresh_token: string;
    readonly openid: string;
    readonly scope: string;
}

export interface UserInfo {
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

export interface RefreshToken {
    access_token: string;
    expires_in: number;
    refresh_token: number;
    openid: string;
    scope: string;
}
