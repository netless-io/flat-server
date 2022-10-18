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

export const OAuth2AccessTokenSchema = {
    body: Type.Object({
        grantType: Type.String({
            enum: ["authorization_code"],
        }),
        clientID: Type.String({
            minLength: 10,
        }),
        clientSecret: Type.String({
            minLength: 10,
        }),
        code: Type.String({
            minLength: 10,
        }),
    }),
};

export const oauth2AccessToken = async (
    req: FastifyRequestTypebox<typeof OAuth2AccessTokenSchema>,
    reply: FastifyReply,
): Promise<void> => {
    const [err, userUUID] = await errPairSync(
        DeveloperOAuthAuthorizeService.getAuthorizeCodePayload(req.body.code),
    );
    if (err) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        req[kAPILogger].error("invalid code", parseError(error));
        return reply.send({
            error: "access_denied",
            error_description: "invalid code",
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

    const developerOAuthAuthorizeSVC = new DeveloperOAuthAuthorizeService(
        req.ids,
        req.DBTransaction,
        userUUID,
    );

    try {
        await developerOAuthAuthorizeSVC.recycleAuthorizeCode(req.body.code);
    } catch (error) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        req[kAPILogger].error("recycle authorize code failed", parseError(error));
        return reply.send({
            error: "server_error",
            error_description: "recycle authorize code failed",
        });
    }

    {
        const result = await RedisService.hmget(
            RedisKey.oauthAuthorizeTokenByUserUUID(req.body.clientID, userUUID),
            ["accessToken", "refreshToken"],
        );

        if (result[0]) {
            await RedisService.del(RedisKey.oauthAuthorizeAccessToken(result[0]));
        }
        if (result[1]) {
            await RedisService.del(RedisKey.oauthAuthorizeRefreshToken(result[1]));
        }
    }

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
