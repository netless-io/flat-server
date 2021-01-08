import redisService from "../../../service/RedisService";
import { socketNamespaces } from "../../../store/SocketNamespaces";
import { SocketNsp, Status, WeChatSocketEvents } from "../../../../Constants";
import { wechatRequest } from "../../../utils/WeChatRequest";
import { getAccessTokenURL, getUserInfoURL } from "../../../utils/WeChatURL";
import { AccessToken, UserInfo } from "../../../types/WeChatResponse";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { v4 } from "uuid";
import { LoginPlatform, Sex } from "../Constants";
import { getConnection } from "typeorm";
import { RedisKey } from "../../../../utils/Redis";
import { ErrorCode } from "../../../../ErrorCode";
import { UserDAO, UserWeChatDAO } from "../../../dao";

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
        console.error(`uuid verification failed, current uuid: ${code}`);
        socket.emit(WeChatSocketEvents.LoginStatus, {
            status: Status.AuthFailed,
            code: ErrorCode.ParamsCheckFailed,
        });

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

                    return Promise.all([createUser, createUserWeChat]);
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

        await redisService.del(RedisKey.weChatAuthUUID(uuid));

        const getUserInfoByUser = await UserDAO().findOne(["user_name", "sex", "avatar_url"], {
            user_uuid: userUUID,
        });

        const { user_name, avatar_url, sex } = getUserInfoByUser!;

        reply.jwtSign(
            {
                userUUID,
                loginSource: LoginPlatform.WeChat,
            },
            (err: any, token: any) => {
                if (err) {
                    console.error(err.message);
                    socket.emit(WeChatSocketEvents.LoginStatus, {
                        status: Status.AuthFailed,
                        code: ErrorCode.JWTSignFailed,
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
        console.error(e);
        socket.emit(WeChatSocketEvents.LoginStatus, {
            status: Status.AuthFailed,
            code: ErrorCode.CurrentProcessFailed,
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
