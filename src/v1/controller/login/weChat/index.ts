import redisService from "../../../service/RedisService";
import { socketNamespaces } from "../../../store/SocketNamespaces";
import { RedisKeyPrefix, SocketNsp, Status, WeChatSocketEvents } from "../../../../Constants";
import { wechatRequest } from "../../../utils/WeChatRequest";
import { getAccessTokenURL, getUserInfoURL } from "../../../utils/WeChatURL";
import { AccessToken, UserInfo } from "../../../types/WeChatResponse";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { UserWeChatAttributes, UserWeChatModel } from "../../../model/user/WeChat";
import { UserAttributes, UserModel } from "../../../model/user/User";
import { timestampFormat } from "../../../../utils/Time";
import { v4 } from "uuid";
import { Model } from "sequelize";
import { sequelize } from "../../../service/SequelizeService";
import { LoginPlatform } from "../Constants";

export const callback = async (
    req: PatchRequest<{
        Querystring: CallbackQuery;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    reply.headers({
        "content-type": "text/html",
    });
    reply.send();

    const { state: uuid, code } = req.query;
    const { socketID } = req.params as CallbackParams;

    const socket = socketNamespaces[SocketNsp.Login].sockets.get(socketID);

    if (typeof socket === "undefined") {
        return;
    }

    socket.emit(WeChatSocketEvents.LoginStatus, {
        status: Status.Process,
    });

    const result = await redisService.get(`${RedisKeyPrefix.WECHAT_AUTH_UUID}:${uuid}`);

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

        const getUserIDByUserWeChatInstance = await UserWeChatModel.findOne({
            where: {
                open_uuid: weChatUserInfo.openid,
                is_delete: false,
            },
            attributes: ["user_uuid"],
        });

        let userUUID = "";
        if (getUserIDByUserWeChatInstance === null) {
            const timestamp = timestampFormat();
            userUUID = v4();

            await sequelize
                .transaction(async t => {
                    const createUser = UserModel.create(
                        {
                            user_name: weChatUserInfo.nickname,
                            user_uuid: userUUID,
                            // TODO need upload headimgurl to remote oss server
                            avatar_url: weChatUserInfo.headimgurl,
                            sex: weChatUserInfo.sex,
                            user_password: "",
                            phone: "",
                            last_login_platform: LoginPlatform.WeChat,
                            created_at: timestamp,
                            updated_at: timestamp,
                            version: 0,
                            is_delete: false,
                        },
                        { transaction: t },
                    );

                    const createWeChatUser = UserWeChatModel.create(
                        {
                            user_uuid: userUUID,
                            open_uuid: weChatUserInfo.openid,
                            union_uuid: weChatUserInfo.unionid,
                            updated_at: timestamp,
                            created_at: timestamp,
                            version: 0,
                            is_delete: false,
                        },
                        { transaction: t },
                    );

                    return Promise.all([createUser, createWeChatUser]);
                })
                .catch(e => {
                    console.error(e);
                    throw new Error("Failed to create user");
                });
        } else {
            userUUID = getUserIDByUserWeChatInstance.get().user_uuid;
        }

        const getIDByUserWeChatInstance = (await UserWeChatModel.findOne({
            where: {
                user_uuid: userUUID,
            },
            attributes: ["id"],
        })) as Model<UserWeChatAttributes>;

        const id = getIDByUserWeChatInstance.get().id;

        await redisService.set(
            `${RedisKeyPrefix.WECHAT_REFRESH_TOKEN}:${id}`,
            accessToken.refresh_token,
            60 * 60 * 24 * 29,
        );

        await redisService.del(`${RedisKeyPrefix.WECHAT_AUTH_UUID}:${uuid}`);

        const getUserInfoByUserInstance = (await UserModel.findOne({
            where: {
                user_uuid: userUUID,
            },
            attributes: ["user_name", "sex", "avatar_url"],
        })) as Model<UserAttributes>;

        const { user_name, avatar_url, sex } = getUserInfoByUserInstance.get();

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

type CallbackQuery = {
    state: string;
    code: string;
};

type CallbackParams = {
    socketID: string;
};

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
