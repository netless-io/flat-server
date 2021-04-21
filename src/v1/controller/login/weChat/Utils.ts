import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { getAccessTokenURL, getUserInfoURL } from "../../../utils/request/wechat/WeChatURL";
import { wechatRequest } from "../../../utils/request/wechat/WeChatRequest";
import { AccessToken, UserInfo } from "../../../types/WeChatResponse";
import { UserDAO, UserWeChatDAO } from "../../../dao";
import { LoginPlatform } from "../Constants";
import redisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { FastifyReply } from "fastify";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { Response } from "../../../types/Server";

export const registerOrLoginWechat = async (
    code: string,
    authUUID: string,
    type: "WEB" | "MOBILE",
    reply: FastifyReply,
): Response<WeChatResponse> => {
    const result = await redisService.get(RedisKey.authUUID(authUUID));

    if (result === null) {
        console.error(`uuid verification failed, current code: ${code}, current uuid: ${authUUID}`);
        await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);

        return {
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        };
    }

    const accessTokenURL = getAccessTokenURL(code, type);
    const accessToken = await wechatRequest<AccessToken>(accessTokenURL);

    const userInfoURL = getUserInfoURL(accessToken.access_token, accessToken.openid);
    const weChatUserInfo = await wechatRequest<UserInfo>(userInfoURL);

    const getUserInfoByUserWeChat = await UserWeChatDAO().findOne(["user_uuid", "user_name"], {
        union_uuid: weChatUserInfo.unionid,
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
                    user_password: "",
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

    const getUserInfoByUser = await UserDAO().findOne(["user_name", "avatar_url"], {
        user_uuid: userUUID,
    });

    const { user_name: name, avatar_url: avatar } = getUserInfoByUser!;

    let token = "";
    try {
        token = await reply.jwtSign({
            userUUID,
            loginSource: LoginPlatform.WeChat,
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
    } catch (err) {
        await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);
        throw err;
    }

    return {
        status: Status.Success,
        data: {
            name,
            avatar,
            userUUID,
            token,
        },
    };
};

interface WeChatResponse {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
}
