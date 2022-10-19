import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";

export type DeveloperOAuthUserGrantConfig = {
    oauthUUID: string;
    scopes: DeveloperOAuthScope[];
};
