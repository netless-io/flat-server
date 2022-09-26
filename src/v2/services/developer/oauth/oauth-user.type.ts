import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";

export type DeveloperOAuthUserInfoConfig = {
    page: number;
    size: number;
};

export type DeveloperOAuthUserInfoSQL = {
    ownerName: string;
    oauthUUID: string;
    appName: string;
    logoURL: string;
    homepageURL: string;
};

export type DeveloperOAuthUserInfoReturn = DeveloperOAuthUserInfoSQL[];

export type DeveloperOAuthUserGrantConfig = {
    oauthUUID: string;
    scopes: DeveloperOAuthScope[];
};
