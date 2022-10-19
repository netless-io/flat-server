import { Server } from "../../../utils/registryRoutersV2";
import { oauth2AuthorizeView, OAuth2AuthorizeViewSchema } from "./authorize/authorize-view";
import {
    oauth2AuthorizeRedirect,
    OAuth2AuthorizeRedirectSchema,
} from "./authorize/authorize-redirect";
import { oauth2AccessToken, OAuth2AccessTokenSchema } from "./authorize/access-token";
import { oauth2APIUserProfile, OAuth2APIUserProfileSchema } from "./api/user-profile";
import { OAuth2RefreshTokenSchema, oauthRefreshToken } from "./authorize/refresh-token";

export const oauthRouters = (server: Server): void => {
    server.get("oauth2/authorize", oauth2AuthorizeView, {
        schema: OAuth2AuthorizeViewSchema,
        auth: false,
        autoHandle: false,
    });

    server.post("oauth2/authorize", oauth2AuthorizeRedirect, {
        schema: OAuth2AuthorizeRedirectSchema,
        auth: false,
        autoHandle: false,
    });

    server.post("oauth2/access-token", oauth2AccessToken, {
        schema: OAuth2AccessTokenSchema,
        auth: false,
        autoHandle: false,
    });

    server.post("oauth2/refresh-token", oauthRefreshToken, {
        schema: OAuth2RefreshTokenSchema,
        auth: false,
        autoHandle: false,
    });

    server.post("oauth2/api/user-profile", oauth2APIUserProfile, {
        schema: OAuth2APIUserProfileSchema,
        auth: false,
        autoHandle: false,
    });
};
