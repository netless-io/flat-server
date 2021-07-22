import { v4 } from "uuid";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { FastifyReply } from "fastify";
import { LoginPlatform } from "../../../../constants/Project";
import { Logger, LoggerAPI } from "../../../../logger";
import { LoginWechat } from "../platforms/LoginWechat";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";
import { ServiceUser } from "../../../service/user/User";

export const wechatCallback = async (
    code: string,
    authUUID: string,
    type: "WEB" | "MOBILE",
    logger: Logger<LoggerAPI>,
    reply: FastifyReply,
): Promise<WeChatResponse> => {
    await LoginWechat.assertHasAuthUUID(authUUID, logger);

    const userInfo = await LoginWechat.getUserInfoAndToken(code, type);

    const userUUIDByDB = await ServiceUserWeChat.getUserUUIDByUnionUUID(userInfo.unionUUID);

    const userUUID = userUUIDByDB || v4();

    const svc = {
        user: new ServiceUser(userUUID),
        userWeChat: new ServiceUserWeChat(userUUID),
    };

    const loginWechat = new LoginWechat({
        userUUID,
        svc,
    });

    const { userName, avatarURL } = await (async () => {
        if (!userUUIDByDB) {
            await loginWechat.register(userInfo);
            return userInfo;
        }

        return (await svc.user.getNameAndAvatar())!;
    })();

    await redisService.set(
        RedisKey.wechatRefreshToken(userUUID),
        userInfo.refreshToken,
        60 * 60 * 24 * 29,
    );

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
