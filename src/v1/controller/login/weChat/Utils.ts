import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { UserDAO, UserWeChatDAO } from "../../../../dao";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { FastifyReply } from "fastify";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { Response } from "../../../../types/Server";
import { LoginPlatform } from "../../../../constants/Project";
import {
    getWeChatAccessToken,
    getWeChatUserInfo,
} from "../../../utils/request/wechat/WeChatRequest";
import { Logger, LoggerAPI, parseError } from "../../../../logger";

export const registerOrLoginWechat = async (
    code: string,
    authUUID: string,
    type: "WEB" | "MOBILE",
    logger: Logger<LoggerAPI>,
    reply: FastifyReply,
): Response<WeChatResponse> => {
    const result = await redisService.get(RedisKey.authUUID(authUUID));

    if (result === null) {
        logger.warn("uuid verification failed");

        await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);

        return {
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        };
    }

    const accessToken = await getWeChatAccessToken(code, type);

    const weChatUserInfo = await getWeChatUserInfo(accessToken.access_token, accessToken.openid);

    const getUserInfoByUserWeChat = await UserWeChatDAO().findOne(["user_uuid", "user_name"], {
        union_uuid: weChatUserInfo.unionid,
    });

    let userUUID = "";
    if (getUserInfoByUserWeChat === undefined) {
        userUUID = v4();

        await getConnection().transaction(async t => {
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
                .catch(err => {
                    logger.warn("update wechat nickname failed", parseError(err));
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

    const token = await reply.jwtSign({
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
