import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox } from "../../../../types/Server";
import { FastifyReply } from "fastify";
import { errPairSync } from "../../../services/developer/oauth/internal/utils/err-pair";
import { getUserUUIDInJWT } from "./internal/utils/jwt-verifier";
import { Website } from "../../../../constants/Config";
import { stringify } from "querystring";
import { DeveloperOAuthAuthorizeService } from "../../../services/developer/oauth/oauth-authorize";
import authorizeRedirectEta from "./templates/authorize-redirect.eta";
import { DeveloperOAuthUserService } from "../../../services/developer/oauth/oauth-user";

export const OAuth2AuthorizeRedirectSchema = {
    body: Type.Object(
        {
            redirectURI: Type.String({
                minLength: 5,
            }),
            state: Type.String({
                minLength: 1,
            }),
            oauthUUID: Type.String({
                format: "uuid-v4",
            }),
            authorize: Type.String({
                enum: ["true", "false"],
            }),
        },
        {
            additionalProperties: true,
        },
    ),
};

export const oauth2AuthorizeRedirect = async (
    req: FastifyRequestTypebox<typeof OAuth2AuthorizeRedirectSchema>,
    reply: FastifyReply,
): Promise<void> => {
    const [err, userUUID] = await errPairSync(getUserUUIDInJWT(req.cookies.flatJWTToken));
    if (err) {
        const logoURL = `${Website}/login?${stringify({
            redirect: req.url,
        })}`;

        return reply.redirect(302, logoURL);
    }

    const redirectURI = decodeURIComponent(req.body.redirectURI)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .trim();

    const sep = new URL(redirectURI).search ? "&" : "?";

    const developerOAuthAuthorizeSVC = new DeveloperOAuthAuthorizeService(
        req.ids,
        req.DBTransaction,
        userUUID,
    );
    const csrfToken = await developerOAuthAuthorizeSVC.getAuthorizeCSRFToken(req.body.oauthUUID);
    if (!csrfToken) {
        return reply.redirect(
            302,
            `${redirectURI}${sep}error=access_denied&error_description=csrf+token+expired&state=${req.body.state}`,
        );
    }
    await developerOAuthAuthorizeSVC.recycleAuthorizeCSRFToken(req.body.oauthUUID);

    if (req.body.authorize === "false") {
        return reply.redirect(
            302,
            `${redirectURI}${sep}error=access_denied&error_description=The+user+denied+your+request&state=${req.body.state}`,
        );
    }

    const [err2, scopes] = await errPairSync(
        developerOAuthAuthorizeSVC.getOAuthAuthorizeScopes(req.body.oauthUUID),
    );
    if (err2) {
        return reply.redirect(
            302,
            `${redirectURI}${sep}error=invalid_scope&error_description=scope+is+expired&state=${req.body.state}`,
        );
    }

    const developerOAuthUserSVC = new DeveloperOAuthUserService(
        req.ids,
        req.DBTransaction,
        userUUID,
    );

    await developerOAuthUserSVC.grant({
        oauthUUID: req.body.oauthUUID,
        scopes,
    });

    const code = await developerOAuthAuthorizeSVC.generateAuthorizeCode(userUUID);

    return reply.view(authorizeRedirectEta, {
        redirectURL: `${redirectURI}${sep}code=${code}&state=${req.body.state}`,
    });
};
