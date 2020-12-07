import { Next, Request, Response } from "restify";
import redisService from "../../../service/RedisService";
import { socketNamespaces } from "../../../store/SocketNamespaces";
import { HTTPValidationRules } from "../../../types/Server";
import { RedisKeyPrefix, SocketNsp, Status, WeChatSocketEvents } from "../../../../Constants";
import { wechatRequest } from "../../../utils/WeChatRequest";
import { getWeChatUserID, getWeChatUserInfo, registerUser } from "../../../model/user/WeChat";
import { getAccessTokenURL, getUserInfoURL } from "../../../utils/WeChatURL";
import { AccessToken, UserInfo } from "../../../types/WeChatResponse";
import { WeChatUserField } from "../../../model/types";

export const callback = async (req: Request, res: Response, next: Next): Promise<void> => {
    res.header("content-type", "text/html");
    res.end("");

    const { state: uuid, code } = req.query as CallbackQuery;
    const { socketID } = req.params as CallbackParams;

    const socket = socketNamespaces[SocketNsp.Login].sockets.get(socketID);

    if (typeof socket === "undefined") {
        return next();
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

        return next();
    }

    try {
        const accessTokenURL = getAccessTokenURL(code);
        const accessToken = await wechatRequest<AccessToken>(accessTokenURL);

        const userInfoURL = getUserInfoURL(accessToken.access_token, accessToken.openid);
        const weChatUserInfo = await wechatRequest<UserInfo>(userInfoURL);

        let userID = await getWeChatUserID(weChatUserInfo.openid);
        if (!userID) {
            userID = await registerUser({
                name: weChatUserInfo.nickname,
                avatarURL: weChatUserInfo.headimgurl,
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

        socket.emit(WeChatSocketEvents.LoginStatus, {
            status: Status.Success,
            data: {
                ...weChatUserInfo,
                userid: userID,
            },
        });
    } catch (e: unknown) {
        socket.emit(WeChatSocketEvents.LoginStatus, {
            status: Status.AuthFailed,
            message: (e as Error).message,
        });
    }

    next();
};

export const callbackValidationRules: HTTPValidationRules = {
    query: ["code", "state"],
    params: ["socketID"],
};

type CallbackQuery = {
    state: string;
    code: string;
};

type CallbackParams = {
    socketID: string;
};
