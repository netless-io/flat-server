import { FastifyRequestTypebox } from "../../../../types/Server";
import { Type } from "@sinclair/typebox";
import { FastifyReply } from "fastify";
import authorizeViewEta from "./templates/authorize-view.eta";
import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";
import { DeveloperOAuthAuthorizeService } from "../../../services/developer/oauth/oauth-authorize";
import { kAPILogger } from "../../../../plugins/fastify/api-logger";
import { parseError } from "../../../../logger";
import { stringify } from "querystring";
import { Website } from "../../../../constants/Config";
import { getUserUUIDInJWT } from "./internal/utils/jwt-verifier";
import { errPairSync } from "../../../services/developer/oauth/internal/utils/err-pair";
import { oauth2AuthorizeRedirect, OAuth2AuthorizeRedirectSchema } from "./authorize-redirect";

export const OAuth2AuthorizeViewSchema = {
    querystring: Type.Object(
        {
            clientID: Type.String({
                minLength: 10,
            }),
            redirectURI: Type.String({
                minLength: 5,
            }),
            scopes: Type.String({
                minLength: 5,
            }),
            state: Type.String({
                minLength: 1,
            }),
        },
        {
            additionalProperties: true,
        },
    ),
};

export const oauth2AuthorizeView = async (
    req: FastifyRequestTypebox<typeof OAuth2AuthorizeViewSchema>,
    reply: FastifyReply,
): Promise<void> => {
    const [err, userUUID] = await errPairSync(getUserUUIDInJWT(req.cookies.flatJWTToken));
    if (err) {
        const logoURL = `${Website}/login?${stringify({
            redirect: req.url,
        })}`;

        return reply.redirect(302, logoURL);
    }

    const redirectURI = req.query.redirectURI
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .trim();

    const developerOAuthAuthorizeSVC = new DeveloperOAuthAuthorizeService(
        req.ids,
        req.DBTransaction,
        userUUID,
    );

    const scopes = req.query.scopes.split(" ").map(i => i.trim()) as DeveloperOAuthScope[];

    try {
        const result = await developerOAuthAuthorizeSVC.view({
            ...req.query,
            scopes,
        });

        const sep = new URL(redirectURI).search ? "&" : "?";

        if (result.status === "hasGrant" || result.status === "success") {
            await developerOAuthAuthorizeSVC.saveOAuthAuthorizeScopes(
                result.data.oauthUUID,
                scopes,
            );
        }

        switch (result.status) {
            case "hasGrant": {
                return await oauth2AuthorizeRedirect(
                    {
                        ...req,
                        body: {
                            state: req.query.state,
                            oauthUUID: result.data.oauthUUID,
                            redirectURI: req.query.redirectURI,
                            authorize: "true",
                        },
                    } as FastifyRequestTypebox<typeof OAuth2AuthorizeRedirectSchema>,
                    reply,
                );
            }
            case "error": {
                return await reply.redirect(
                    302,
                    `${redirectURI}${sep}error=${result.error}&error_description=${result.errorDescription}&state=${req.query.state}`,
                );
            }
            default: {
                return await reply.view(authorizeViewEta, {
                    appName: result.data.appName,
                    logoURL: result.data.logoURL,
                    ownerAvatarURL: result.data.ownerAvatarURL,
                    ownerName: result.data.ownerName,
                    scopes: result.data.scopes,
                    callbackURL: result.data.callbackURL,
                    csrfToken: result.data.csrfToken,
                    oauthUUID: result.data.oauthUUID,
                    state: req.query.state,
                    redirectURI: redirectURI,
                });
            }
        }
    } catch (error) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        req[kAPILogger].error("oauth authorize handler failed", parseError(error));
        return reply.redirect(302, `${redirectURI}?error=server_error`);
    }
};
