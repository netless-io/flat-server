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

    const result = await redisService.get(`${RedisKeyPrefix.WX_AUTH_UUID}:${uuid}`);

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
                open_id: weChatUserInfo.openid,
                is_delete: false,
            },
            attributes: ["user_id"],
        });

        let userID = "";
        if (getUserIDByUserWeChatInstance === null) {
            const timestamp = timestampFormat();
            userID = v4();

            await sequelize
                .transaction(async t => {
                    const createUser = UserModel.create(
                        {
                            name: weChatUserInfo.nickname,
                            user_id: userID,
                            // TODO need upload headimgurl to remote oss server
                            avatar_url: weChatUserInfo.headimgurl,
                            sex: weChatUserInfo.sex,
                            password: "",
                            phone: "",
                            last_login_platform: "WeChat",
                            created_at: timestamp,
                            updated_at: timestamp,
                            version: 0,
                            is_delete: false,
                        },
                        { transaction: t },
                    );

                    const createWeChatUser = UserWeChatModel.create(
                        {
                            user_id: userID,
                            open_id: weChatUserInfo.openid,
                            union_id: weChatUserInfo.unionid,
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
            userID = getUserIDByUserWeChatInstance.get().user_id;
        }

        const getIDByUserWeChatInstance = (await UserWeChatModel.findOne({
            where: {
                user_id: userID,
            },
            attributes: ["id"],
        })) as Model<UserWeChatAttributes>;

        const id = getIDByUserWeChatInstance.get().id;

        await redisService.set(
            `${RedisKeyPrefix.WX_REFRESH_TOKEN}:${id}`,
            accessToken.refresh_token,
            60 * 60 * 24 * 29,
        );

        await redisService.del(`${RedisKeyPrefix.WX_AUTH_UUID}:${uuid}`);

        const getUserInfoByUserInstance = (await UserModel.findOne({
            where: {
                user_id: userID,
            },
            attributes: ["name", "sex", "avatar_url"],
        })) as Model<UserAttributes>;

        const { name, avatar_url, sex } = getUserInfoByUserInstance.get();

        reply.jwtSign(
            {
                userID,
                loginSource: "WeChat",
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
                            name,
                            sex: Number(sex),
                            avatar: avatar_url,
                            userID,
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
