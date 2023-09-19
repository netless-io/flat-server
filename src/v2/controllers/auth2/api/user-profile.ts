import { FastifyRequestTypebox } from "../../../../types/Server";
import { FastifyReply } from "fastify";
import { Type } from "@sinclair/typebox";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { oauthInfosDAO, userDAO } from "../../../dao";
import { DeveloperOAuthUserService } from "../../../services/developer/oauth/oauth-user";
import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";
import { generateAvatar } from "../../../../utils/Avatar";

export const OAuth2APIUserProfileSchema = {
    headers: Type.Object(
        {
            authorization: Type.String({
                minLength: 10,
            }),
        },
        {
            additionalProperties: true,
        },
    ),
};

export const oauth2APIUserProfile = async (
    req: FastifyRequestTypebox<typeof OAuth2APIUserProfileSchema>,
    reply: FastifyReply,
): Promise<void> => {
    const { authorization } = req.headers;
    const [userUUID, clientID] = await RedisService.hmget(
        RedisKey.oauthAuthorizeAccessToken(authorization),
        ["userUUID", "clientID"],
    );
    if (!userUUID || !clientID) {
        return reply.send({
            error: "invalid_token",
            error_description: "invalid access token",
        });
    }

    try {
        const { oauth_uuid: oauthUUID } = await oauthInfosDAO.findOne(
            req.DBTransaction,
            "oauth_uuid",
            {
                client_id: clientID,
            },
        );

        if (!oauthUUID) {
            return reply.send({
                error: "access_denied",
                error_description: "auth application not found",
            });
        }

        const developerOAuthUserSVC = new DeveloperOAuthUserService(
            req.ids,
            req.DBTransaction,
            userUUID,
        );

        if (!(await developerOAuthUserSVC.hasGrant(oauthUUID))) {
            return reply.send({
                error: "access_denied",
                error_description: "user not grant this application",
            });
        }

        const scopes = await developerOAuthUserSVC.getScopes(oauthUUID);
        const userInfo = await userDAO.findOne(req.DBTransaction, ["user_name", "avatar_url"], {
            user_uuid: userUUID,
        });

        if (!userInfo) {
            return reply.send({
                error: "access_denied",
                error_description: "user not found",
            });
        }

        return reply.send({
            userUUID: scopes.includes(DeveloperOAuthScope.UserUUIDRead) ? userUUID : undefined,
            userName: scopes.includes(DeveloperOAuthScope.UserNameRead)
                ? userInfo.user_name
                : undefined,
            avatarURL: scopes.includes(DeveloperOAuthScope.UserAvatarRead)
                ? userInfo.avatar_url || generateAvatar(userUUID)
                : undefined,
        });
    } catch (error) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        req[kAPILogger].error("request oauth2 api user profile", parseError(error));
        return reply.send({
            error: "server_error",
            error_description: "server error",
        });
    }
};
