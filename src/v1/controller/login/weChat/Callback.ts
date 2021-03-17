import { PatchRequest } from "../../../types/Server";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import redisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { FastifyReply } from "fastify";
import { getAccessTokenURL, getUserInfoURL } from "../../../utils/request/wechat/WeChatURL";
import { wechatRequest } from "../../../utils/request/wechat/WeChatRequest";
import { AccessToken, UserInfo } from "../../../types/WeChatResponse";
import { UserDAO, UserWeChatDAO } from "../../../dao";
import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { LoginPlatform, Sex } from "../Constants";
import { AuthValue } from "./Constants";

export const callback = async (
    req: PatchRequest<{
        Querystring: CallbackQuery;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    void reply.headers({
        "content-type": "text/html",
    });
    void reply.send();

    const { state: authID, code } = req.query;

    const result = await redisService.get(RedisKey.weChatAuthUUID(authID));

    if (result !== AuthValue.Process) {
        console.error(`uuid verification failed, current code: ${code}, current uuid: ${authID}`);
        await redisService.set(
            RedisKey.weChatAuthUUID(authID),
            AuthValue.ParamsCheckFailed,
            60 * 60,
        );
        return;
    }

    try {
        const accessTokenURL = getAccessTokenURL(code);
        const accessToken = await wechatRequest<AccessToken>(accessTokenURL);

        const userInfoURL = getUserInfoURL(accessToken.access_token, accessToken.openid);
        const weChatUserInfo = await wechatRequest<UserInfo>(userInfoURL);

        const getUserInfoByUserWeChat = await UserWeChatDAO().findOne(["user_uuid", "user_name"], {
            open_uuid: weChatUserInfo.openid,
        });

        let userUUID = "";
        if (getUserInfoByUserWeChat === undefined) {
            userUUID = v4();

            await getConnection()
                .transaction(async t => {
                    const createUser = UserDAO(t).insert({
                        user_name: weChatUserInfo.nickname,
                        user_uuid: userUUID,
                        // TODO need upload headimgurl to remote oss server
                        avatar_url: weChatUserInfo.headimgurl,
                        sex: weChatUserInfo.sex === 1 ? Sex.Man : Sex.Woman,
                        user_password: "",
                        phone: "",
                        last_login_platform: LoginPlatform.WeChat,
                    });

                    const createUserWeChat = UserWeChatDAO(t).insert({
                        user_uuid: userUUID,
                        open_uuid: weChatUserInfo.openid,
                        union_uuid: weChatUserInfo.unionid,
                        user_name: weChatUserInfo.nickname,
                    });

                    return await Promise.all([createUser, createUserWeChat]);
                })
                .catch(e => {
                    console.error(e);
                    throw new Error("Failed to create user");
                });
        } else {
            const { user_name } = getUserInfoByUserWeChat;
            userUUID = getUserInfoByUserWeChat.user_uuid;

            // wechat name update
            if (weChatUserInfo.nickname !== user_name) {
                UserWeChatDAO()
                    .update(
                        {
                            user_name: weChatUserInfo.nickname,
                        },
                        {
                            user_uuid: userUUID,
                        },
                    )
                    .catch(e => {
                        console.error(e);
                        console.error("update wechat nickname failed");
                    });
            }
        }

        await redisService.set(
            RedisKey.wechatRefreshToken(userUUID),
            accessToken.refresh_token,
            60 * 60 * 24 * 29,
        );

        const getUserInfoByUser = await UserDAO().findOne(["user_name", "sex", "avatar_url"], {
            user_uuid: userUUID,
        });

        const { user_name, avatar_url, sex } = getUserInfoByUser!;

        reply.jwtSign(
            {
                userUUID,
                loginSource: LoginPlatform.WeChat,
            },
            (err: any, token: any): void => {
                if (err) {
                    console.error(err.message);
                    void redisService.set(
                        RedisKey.weChatAuthUUID(authID),
                        AuthValue.JWTSignFailed,
                        60 * 60,
                    );
                } else {
                    void redisService.set(
                        RedisKey.weChatAuthUUID(authID),
                        JSON.stringify({
                            name: user_name,
                            sex,
                            avatar: avatar_url,
                            userUUID,
                            token,
                        }),
                        60 * 60,
                    );
                }
            },
        );
    } catch (e: unknown) {
        console.error(e);
        await redisService.set(
            RedisKey.weChatAuthUUID(authID),
            AuthValue.CurrentProcessFailed,
            60 * 60,
        );
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
        },
        code: {
            type: "string",
        },
    },
};
