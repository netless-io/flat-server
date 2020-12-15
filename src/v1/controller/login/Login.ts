import redisService from "../../service/RedisService";
import { getWeChatUserInfo } from "../../model/user/WeChat";
import { LoginPlatform, RedisKeyPrefix, Status } from "../../../Constants";
import { renewAccessToken } from "../../utils/WeChatURL";
import { wechatRequest } from "../../utils/WeChatRequest";
import { RefreshToken } from "../../types/WeChatResponse";
import { getUserInfo } from "../../model/user/User";
import { PatchRequest } from "../../types/Server";
import { UserField, WeChatUserField } from "../../model/types";
import { FastifyReply } from "fastify";

export const login = async (req: PatchRequest, reply: FastifyReply): Promise<void> => {
    const { userID, loginSource } = req.user;

    if (loginSource === LoginPlatform.WeChat) {
        const weChatUserInfo = (await getWeChatUserInfo(userID)) as WeChatUserField;

        const refreshToken = await redisService.get(
            `${RedisKeyPrefix.WX_REFRESH_TOKEN}:${weChatUserInfo.id}`,
        );

        if (refreshToken === null) {
            return reply.send({
                status: Status.AuthFailed,
                message: "The account token has expired, please log in again",
            });
        }

        try {
            const renewAccessTokenURL = renewAccessToken(refreshToken);
            await wechatRequest<RefreshToken>(renewAccessTokenURL);
        } catch (e: unknown) {
            return reply.send({
                status: Status.AuthFailed,
                message: (e as Error).message,
            });
        }

        const userInfo = (await getUserInfo(userID)) as UserField;

        reply.send({
            status: Status.Success,
            data: {
                name: userInfo.name,
                sex: userInfo.sex,
                avatar: userInfo.avatar_url,
            },
        });
    }
};
