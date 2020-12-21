import redisService from "../../service/RedisService";
import { RedisKeyPrefix, Status } from "../../../Constants";
import { renewAccessToken } from "../../utils/WeChatURL";
import { wechatRequest } from "../../utils/WeChatRequest";
import { RefreshToken } from "../../types/WeChatResponse";
import { PatchRequest } from "../../types/Server";
import { FastifyReply } from "fastify";
import { UserModel } from "../../model/user/User";
import { UserWeChatModel } from "../../model/user/WeChat";
import { LoginPlatform } from "./Constants";
import { getRepository } from "typeorm";

export const login = async (req: PatchRequest, reply: FastifyReply): Promise<void> => {
    const { userUUID, loginSource } = req.user;

    const userInfoInstance = await getRepository(UserModel).findOne({
        select: ["user_name", "sex", "avatar_url"],
        where: {
            user_uuid: userUUID,
        },
    });

    if (userInfoInstance === undefined) {
        return reply.send({
            status: Status.Failed,
            message: "User does not exist",
        });
    }

    if (loginSource === LoginPlatform.WeChat) {
        const weChatUserInfo = await getRepository(UserWeChatModel).findOne({
            select: ["id"],
            where: {
                user_uuid: userUUID,
            },
        });

        if (weChatUserInfo === undefined) {
            return reply.send({
                status: Status.Failed,
                message: "User does not exist",
            });
        }

        const weChatUserID = weChatUserInfo.id;

        const refreshToken = await redisService.get(
            `${RedisKeyPrefix.WECHAT_REFRESH_TOKEN}:${weChatUserID}`,
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

        return reply.send({
            status: Status.Success,
            data: {
                name: userInfoInstance.user_name,
                sex: userInfoInstance.sex,
                avatar: userInfoInstance.avatar_url,
                userUUID,
            },
        });
    }
};
