import redisService from "../../../service/RedisService";
import { socketNamespaces } from "../../../store/SocketNamespaces";
import { RedisKeyPrefix, SocketNsp, Status, WeChatSocketEvents } from "../../../../Constants";
import { wechatRequest } from "../../../utils/WeChatRequest";
import { getWeChatUserID, getWeChatUserInfo, registerUser } from "../../../model/user/WeChat";
import { getAccessTokenURL, getUserInfoURL } from "../../../utils/WeChatURL";
import { AccessToken, UserInfo } from "../../../types/WeChatResponse";
import { UserField, WeChatUserField } from "../../../model/types";
import { getUserInfo } from "../../../model/user/User";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";

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

        let userID = await getWeChatUserID(weChatUserInfo.openid);
        if (!userID) {
            // TODO need upload headimgurl to remote oss server
            userID = await registerUser({
                name: weChatUserInfo.nickname,
                avatarURL: weChatUserInfo.headimgurl,
                sex: weChatUserInfo.sex,
                openID: weChatUserInfo.openid,
                unionID: weChatUserInfo.unionid,
            });
        }

        const { id } = (await getWeChatUserInfo(userID)) as WeChatUserField;

        await redisService.set(
            `${RedisKeyPrefix.WX_REFRESH_TOKEN}:${id}`,
            accessToken.refresh_token,
            60 * 60 * 24 * 29,
        );

        await redisService.del(`${RedisKeyPrefix.WX_AUTH_UUID}:${uuid}`);

        const { name, avatar_url, sex } = (await getUserInfo(userID)) as UserField;

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
                            token,
                            userID,
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
