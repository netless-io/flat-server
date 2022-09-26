import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";

export type DeveloperOAuthInfoCreateConfig = {
    oauthUUID: string;
    appName: string;
    appDesc: string;
    homepageURL: string;
    scopes: DeveloperOAuthScope[];
    callbacksURL: string[];
};

export type DeveloperOAuthInfoCreateReturn = {
    oauthUUID: string;
    clientID: string;
    appName: string;
    appDesc: string;
    homepageURL: string;
    logoURL: string;
    scopes: DeveloperOAuthScope[];
    callbacksURL: string[];
};

export type DeveloperOAuthInfoUpdateConfig = {
    oauthUUID: string;
    appName?: string;
    appDesc?: string;
    homepageURL?: string;
    scopes?: DeveloperOAuthScope[];
    callbacksURL?: string[];
};

export type DeveloperOAuthInfoInfoReturn = {
    appName: string;
    appDesc: string;
    homepageURL: string;
    clientID: string;
    logoURL: string;
    scopes: DeveloperOAuthScope[];
    callbacksURL: string[];
};

export type DeveloperOAuthInfoDetailByDB = {
    ownerName: string;
    appName: string;
    appDesc: string;
    homepageURL: string;
    logoURL: string;
    scopes: string;
};

export type DeveloperOAuthInfoDetailReturn = {
    ownerName: string;
    appName: string;
    appDesc: string;
    homepageURL: string;
    logoURL: string;
    scopes: DeveloperOAuthScope[];
};
