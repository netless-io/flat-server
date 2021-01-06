import redisService from "../../service/RedisService";
import { Status } from "../../../Constants";
import { renewAccessToken } from "../../utils/WeChatURL";
import { wechatRequest } from "../../utils/WeChatRequest";
import { RefreshToken } from "../../types/WeChatResponse";
import { PatchRequest } from "../../types/Server";
import { FastifyReply } from "fastify";
import { UserModel } from "../../model/user/User";
import { UserWeChatModel } from "../../model/user/WeChat";
import { LoginPlatform } from "./Constants";
import { getRepository } from "typeorm";
import { RedisKey } from "../../../utils/Redis";
import { ErrorCode } from "../../../ErrorCode";

export const login = async (req: PatchRequest, reply: FastifyReply): Promise<void> => {
    const { userUUID, loginSource } = req.user;

    const userInfoInstance = await getRepository(UserModel).findOne({
        select: ["user_name", "sex", "avatar_url"],
        where: {
            user_uuid: userUUID,
            is_delete: false,
        },
    });

    const weChatUserInfo = await getRepository(UserWeChatModel).findOne({
        select: ["id"],
        where: {
            user_uuid: userUUID,
            is_delete: false,
        },
    });

    if (userInfoInstance === undefined || weChatUserInfo === undefined) {
        return reply.send({
            status: Status.Failed,
            code: ErrorCode.UserNotFound,
        });
    }

    if (loginSource === LoginPlatform.WeChat) {
        const refreshToken = await redisService.get(RedisKey.wechatRefreshToken(userUUID));

        if (refreshToken === null) {
            return reply.send({
                status: Status.AuthFailed,
                code: ErrorCode.NeedLoginAgain,
            });
        }

        try {
            const renewAccessTokenURL = renewAccessToken(refreshToken);
            await wechatRequest<RefreshToken>(renewAccessTokenURL);
        } catch (e: unknown) {
            console.error((e as Error).message);
            return reply.send({
                status: Status.AuthFailed,
                code: ErrorCode.CanRetry,
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
