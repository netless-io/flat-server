import redisService from "../../service/RedisService";
import { LoginPlatform, RedisKeyPrefix, Status } from "../../../Constants";
import { renewAccessToken } from "../../utils/WeChatURL";
import { wechatRequest } from "../../utils/WeChatRequest";
import { RefreshToken } from "../../types/WeChatResponse";
import { PatchRequest } from "../../types/Server";
import { FastifyReply } from "fastify";
import { UserModel } from "../../model/user/User";
import { UserWeChatModel } from "../../model/user/WeChat";

export const login = async (req: PatchRequest, reply: FastifyReply): Promise<void> => {
    const { userID, loginSource } = req.user;

    if (loginSource === LoginPlatform.WeChat) {
        const weChatUserInfoInstance = await UserWeChatModel.findOne({
            where: {
                user_id: userID,
                is_delete: false,
            },
            attributes: ["id"],
        });

        const userInfoInstance = await UserModel.findOne({
            where: {
                user_id: userID,
                is_delete: false,
            },
            attributes: ["name", "sex", "avatar_url"],
        });

        if (weChatUserInfoInstance === null || userInfoInstance === null) {
            return reply.send({
                status: Status.Failed,
                message: "User does not exist",
            });
        }

        const weChatUserID = weChatUserInfoInstance.get().id;

        const refreshToken = await redisService.get(
            `${RedisKeyPrefix.WX_REFRESH_TOKEN}:${weChatUserID}`,
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

        const userInfo = userInfoInstance.get();

        reply.send({
            status: Status.Success,
            data: {
                name: userInfo.name,
                sex: Number(userInfo.sex),
                avatar: userInfo.avatar_url,
                userID,
            },
        });
    }
};
