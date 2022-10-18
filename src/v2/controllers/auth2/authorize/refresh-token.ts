import { FastifyRequestTypebox } from "../../../../types/Server";
import { FastifyReply } from "fastify";
import { Type } from "@sinclair/typebox";
import { DeveloperOAuthAuthorizeService } from "../../../services/developer/oauth/oauth-authorize";
import { errPairSync } from "../../../services/developer/oauth/internal/utils/err-pair";
import { kAPILogger } from "../../../../plugins/fastify/api-logger";
import { parseError } from "../../../../logger";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { DeveloperOAuthSecretService } from "../../../services/developer/oauth/oauth-secret";

export const OAuth2RefreshTokenSchema = {
    body: Type.Object({
        grantType: Type.String({
            enum: ["refresh_token"],
        }),
        clientID: Type.String({
            minLength: 10,
        }),
        clientSecret: Type.String({
            minLength: 10,
        }),
        refreshToken: Type.String({
            minLength: 10,
        }),
    }),
};

export const oauthRefreshToken = async (
    req: FastifyRequestTypebox<typeof OAuth2RefreshTokenSchema>,
    reply: FastifyReply,
): Promise<void> => {
    const [userUUID, accessToken] = await RedisService.hmget(
        RedisKey.oauthAuthorizeRefreshToken(req.body.refreshToken),
        ["userUUID", "accessToken"],
    );
    if (!userUUID || !accessToken) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        req[kAPILogger].error("invalid refreshToken", parseError(error));
        return reply.send({
            error: "access_denied",
            error_description: "invalid refreshToken",
        });
    }

    {
        const developerOAuthSecretSVC = new DeveloperOAuthSecretService(
            req.ids,
            req.DBTransaction,
            userUUID,
        );
        const [err] = await errPairSync(
            developerOAuthSecretSVC.assertExist(req.body.clientID, req.body.clientSecret),
        );
        if (err) {
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            req[kAPILogger].error("invalid clientID or clientSecret", parseError(error));
            return reply.send({
                error: "access_denied",
                error_description: "invalid clientID or clientSecret",
            });
        }
    }

    {
        const accessTokenKey = RedisKey.oauthAuthorizeAccessToken(accessToken);
        const refreshTokenKey = RedisKey.oauthAuthorizeRefreshToken(req.body.refreshToken);
        await RedisService.del(accessTokenKey);
        await RedisService.del(refreshTokenKey);
    }

    const developerOAuthAuthorizeSVC = new DeveloperOAuthAuthorizeService(
        req.ids,
        req.DBTransaction,
        userUUID,
    );

    const result = await developerOAuthAuthorizeSVC.generateOAuthToken(req.body.clientID);
    await RedisService.hmset(RedisKey.oauthAuthorizeTokenByUserUUID(req.body.clientID, userUUID), {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    });

    return reply.send({
        access_token: result.accessToken,
        token_type: "token",
        expires_in: 60 * 60 * 24 * 10,
        refresh_token: result.refreshToken,
    });
};
