import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";

export type DeveloperOAuthCreateConfig = {
    appName: string;
    appDesc: string;
    homepageURL: string;
    callbacksURL: string[];
    scopes: DeveloperOAuthScope[];
};

export type DeveloperOAuthListConfig = {
    page: number;
    size: number;
};

export type DeveloperOAuthListReturn = Array<{
    oauthUUID: string;
    appName: string;
    logoURL: string;
}>;

export type DeveloperOAuthListByUserConfig = {
    page: number;
    size: number;
};

export type DeveloperOAuthListByUserReturn = Array<{
    oauthUUID: string;
    ownerName: string;
    appName: string;
    homepageURL: string;
    logoURL: string;
}>;

export type DeveloperOAuthInfoReturn = {
    appName: string;
    appDesc: string;
    homepageURL: string;
    logoURL: string;
    scopes: DeveloperOAuthScope[];
    callbacksURL: string[];
    userCount: number;
    secrets: Array<{
        secretUUID: string;
        clientSecret: string;
        createdAt: number;
    }>;
};
