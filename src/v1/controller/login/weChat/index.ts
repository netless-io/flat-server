import redisService from "../../../service/RedisService";
import { socketNamespaces } from "../../../store/SocketNamespaces";
import { SocketNsp, Status, WeChatSocketEvents } from "../../../../Constants";
import { wechatRequest } from "../../../utils/WeChatRequest";
import { getAccessTokenURL, getUserInfoURL } from "../../../utils/WeChatURL";
import { AccessToken, UserInfo } from "../../../types/WeChatResponse";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { UserModel } from "../../../model/user/User";
import { v4 } from "uuid";
import { LoginPlatform } from "../Constants";
import { getConnection, getRepository } from "typeorm";
import { UserWeChatModel } from "../../../model/user/WeChat";
import { RedisKey } from "../../../../utils/Redis";

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

    const { state: uuid, code } = req.query;
    const { socketID } = req.params as CallbackParams;

    const socket = socketNamespaces[SocketNsp.Login].sockets.get(socketID);

    if (typeof socket === "undefined") {
        return;
    }

    socket.emit(WeChatSocketEvents.LoginStatus, {
        status: Status.Process,
    });

    const result = await redisService.get(RedisKey.weChatAuthUUID(uuid));

    if (result === null) {
        socket.emit(WeChatSocketEvents.LoginStatus, {
            status: Status.AuthFailed,
            message: `uuid verification failed, current uuid: ${code}`,
        });

        return;
    }

    try {
        const accessTokenURL = getAccessTokenURL(code);
        const accessToken = await wechatRequest<AccessToken>(accessTokenURL);

        const userInfoURL = getUserInfoURL(accessToken.access_token, accessToken.openid);
        const weChatUserInfo = await wechatRequest<UserInfo>(userInfoURL);

        const getUserInfoByUserWeChat = await getRepository(UserWeChatModel).findOne({
            select: ["user_uuid", "user_name"],

            where: {
                open_uuid: weChatUserInfo.openid,
            },
        });

        let userUUID = "";
        if (getUserInfoByUserWeChat === undefined) {
            userUUID = v4();

            await getConnection()
                .transaction(async t => {
                    const createUser = t.insert(UserModel, {
                        user_name: weChatUserInfo.nickname,
                        user_uuid: userUUID,
                        // TODO need upload headimgurl to remote oss server
                        avatar_url: weChatUserInfo.headimgurl,
                        sex: weChatUserInfo.sex,
                        user_password: "",
                        phone: "",
                        last_login_platform: LoginPlatform.WeChat,
                    });

                    const createUserWeChat = t.insert(UserWeChatModel, {
                        user_uuid: userUUID,
                        open_uuid: weChatUserInfo.openid,
                        union_uuid: weChatUserInfo.unionid,
                        user_name: weChatUserInfo.nickname,
                    });

                    return Promise.all([createUser, createUserWeChat]);
                })
                .catch(e => {
                    console.error(e);
                    throw new Error("Failed to create user");
                });
        } else {
            const { user_name, user_uuid: userUUID } = getUserInfoByUserWeChat;

            // wechat name update
            if (weChatUserInfo.nickname !== user_name) {
                getRepository(UserWeChatModel)
                    .createQueryBuilder()
                    .update()
                    .set({
                        user_name: weChatUserInfo.nickname,
                    })
                    .where("user_uuid = :userUUID", {
                        user_uuid: userUUID,
                    })
                    .execute()
                    .catch(e => {
                        console.error("update wechat nickname failed");
                        console.error(e);
                    });
            }
        }

        await redisService.set(
            RedisKey.wechatRefreshToken(userUUID),
            accessToken.refresh_token,
            60 * 60 * 24 * 29,
        );

        await redisService.del(RedisKey.weChatAuthUUID(uuid));

        const getUserInfoByUser = await getRepository(UserModel).findOne({
            select: ["user_name", "sex", "avatar_url"],
            where: {
                user_uuid: userUUID,
            },
        });

        const { user_name, avatar_url, sex } = getUserInfoByUser!;

        reply.jwtSign(
            {
                userUUID,
                loginSource: LoginPlatform.WeChat,
            },
            (err: any, token: any) => {
                if (err) {
                    socket.emit(WeChatSocketEvents.LoginStatus, {
                        status: Status.AuthFailed,
                        message: err.message,
                    });
                } else {
                    socket.emit(WeChatSocketEvents.LoginStatus, {
                        status: Status.Success,
                        data: {
                            name: user_name,
                            sex,
                            avatar: avatar_url,
                            userUUID,
                            token,
                        },
                    });
                }
            },
        );
    } catch (e: unknown) {
        socket.emit(WeChatSocketEvents.LoginStatus, {
            status: Status.AuthFailed,
            message: (e as Error).message,
        });
    }
};

interface CallbackQuery {
    state: string;
    code: string;
}

interface CallbackParams {
    socketID: string;
}

export const callbackSchemaType: FastifySchema<{
    querystring: CallbackQuery;
    params: CallbackParams;
}> = {
    querystring: {
        type: "object",
        required: ["code", "state"],
        properties: {
            code: {
                type: "string",
            },
            state: {
                type: "string",
            },
        },
    },
    params: {
        type: "object",
        required: ["socketID"],
        properties: {
            socketID: {
                type: "string",
            },
        },
    },
};
