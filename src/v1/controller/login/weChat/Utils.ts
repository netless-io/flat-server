import { v4 } from "uuid";
import { FastifyReply } from "fastify";
import { LoginPlatform } from "../../../../constants/Project";
import { Logger, LoggerAPI } from "../../../../logger";
import { LoginWechat } from "../platforms/LoginWechat";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";

export const wechatCallback = async (
    code: string,
    authUUID: string,
    type: "WEB" | "MOBILE",
    logger: Logger<LoggerAPI>,
    reply: FastifyReply,
): Promise<WeChatResponse> => {
    await LoginWechat.assertHasAuthUUID(authUUID, logger);

    const userInfo = await LoginWechat.getUserInfoAndToken(code, type);

    const userUUIDByDB = await ServiceUserWeChat.userUUIDByUnionUUID(userInfo.unionUUID);

    const userUUID = userUUIDByDB || v4();

    const loginWechat = new LoginWechat({
        userUUID,
    });

    if (!userUUIDByDB) {
        await loginWechat.register(userInfo);
    }

    const { userName, avatarURL } = !userUUIDByDB
        ? userInfo
        : (await loginWechat.svc.user.nameAndAvatar())!;

    const jwtToken = await reply.jwtSign({
        userUUID,
        loginSource: LoginPlatform.WeChat,
    });

    await loginWechat.tempSaveUserInfo(authUUID, {
        name: userName,
        token: jwtToken,
        avatar: avatarURL,
    });

    return {
        name: userName,
        avatar: avatarURL,
        userUUID,
        token: jwtToken,
    };
};

interface WeChatResponse {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
}
