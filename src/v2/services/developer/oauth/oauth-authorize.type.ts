import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";

export type DeveloperOAuthAuthorizeAuthorizeConfig = {
    clientID: string;
    redirectURI: string;
    scopes: DeveloperOAuthScope[];
};

export type DeveloperOAuthAuthorizeAuthorizeReturn =
    | {
          status: "hasGrant";
          data: {
              oauthUUID: string;
              csrfToken: string;
          };
      }
    | {
          status: "error";
          error: string;
          errorDescription: string;
      }
    | {
          status: "success";
          data: DeveloperOAuthAuthorizeAuthorizeInfoByClientIDReturn & {
              csrfToken: string;
              callbackURL: string;
          };
      };

export type DeveloperOAuthUserInfoSQL = {
    ownerName: string;
    ownerAvatarURL: string;
    scopes: string;
    oauthUUID: string;
    appName: string;
    logoURL: string;
    homepageURL: string;
    callbacksURL: string;
};

export type DeveloperOAuthAuthorizeAuthorizeInfoByClientIDReturn = Omit<
    DeveloperOAuthUserInfoSQL,
    "scopes" | "callbacksURL"
> & {
    scopes: DeveloperOAuthScope[];
    callbacksURL: string[];
};

export type AuthorizeCodePayload = {
    userUUID: string;
    scopes: string;
};

export type GenerateOAuthTokenReturn = {
    accessToken: string;
    refreshToken: string;
};
