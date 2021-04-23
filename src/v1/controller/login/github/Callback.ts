import { PatchRequest } from "../../../types/Server";
import { FastifyReply } from "fastify";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import redisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import {
    getGithubAccessToken,
    getGithubUserInfo,
} from "../../../utils/request/github/GithubRequest";
import { UserDAO, UserGithubDAO } from "../../../dao";
import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { LoginPlatform } from "../../../Constants";

export const callback = async (
    req: PatchRequest<{
        Querystring: CallbackQuery;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    void reply.headers({
        "content-type": "text/html",
    });

    const { state: authUUID, code } = req.query;

    try {
        const checkAuthUUID = await redisService.get(RedisKey.authUUID(authUUID));

        if (checkAuthUUID === null) {
            console.error(
                `uuid verification failed, current code: ${code}, current uuid: ${authUUID}`,
            );
            await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);

            return reply.send("Failed");
        }

        const accessToken = await getGithubAccessToken(code, authUUID);

        const { id: union_uuid, avatar_url, login: user_name } = await getGithubUserInfo(
            accessToken,
        );

        const getUserInfoByUserGithub = await UserGithubDAO().findOne(["user_uuid", "user_name"], {
            union_uuid: String(union_uuid),
        });

        let userUUID = getUserInfoByUserGithub?.user_uuid || "";
        if (getUserInfoByUserGithub === undefined) {
            userUUID = v4();

            await getConnection()
                .transaction(async t => {
                    const createUser = UserDAO(t).insert({
                        user_name,
                        user_uuid: userUUID,
                        // TODO need upload avatar_url to remote oss server
                        avatar_url,
                        user_password: "",
                    });

                    const createUserGithub = UserGithubDAO(t).insert({
                        user_uuid: userUUID,
                        union_uuid: String(union_uuid),
                        access_token: accessToken,
                        user_name,
                    });

                    return await Promise.all([createUser, createUserGithub]);
                })
                .catch(e => {
                    console.error(e);
                    throw new Error("Failed to create user");
                });
        }

        const getUserInfoByUser = await UserDAO().findOne(["user_name", "avatar_url"], {
            user_uuid: userUUID,
        });

        const { user_name: name, avatar_url: avatar } = getUserInfoByUser!;

        const token = await reply.jwtSign({
            userUUID,
            loginSource: LoginPlatform.Github,
        });

        await redisService.set(
            RedisKey.authUserInfo(authUUID),
            JSON.stringify({
                name: name,
                avatar: avatar,
                userUUID,
                token,
            }),
            60 * 60,
        );

        void reply.send("Success");
    } catch (err: unknown) {
        console.error(err);
        await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);
        void reply.send("Failed");
    }
};

interface CallbackQuery {
    state: string;
    code: string;
}

export const callbackSchemaType: JSONSchemaType<CallbackQuery> = {
    type: "object",
    required: ["state", "code"],
    properties: {
        state: {
            type: "string",
            format: "uuid-v4",
        },
        code: {
            type: "string",
        },
    },
};
