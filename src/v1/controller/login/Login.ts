import redisService from "../../service/RedisService";
import { Status } from "../../../Constants";
import { renewAccessToken } from "../../utils/WeChatURL";
import { wechatRequest } from "../../utils/WeChatRequest";
import { RefreshToken } from "../../types/WeChatResponse";
import { PatchRequest, Response } from "../../types/Server";
import { UserModel } from "../../model/user/User";
import { UserWeChatModel } from "../../model/user/WeChat";
import { LoginPlatform, Sex } from "./Constants";
import { getRepository } from "typeorm";
import { RedisKey } from "../../../utils/Redis";
import { ErrorCode } from "../../../ErrorCode";

export const login = async (req: PatchRequest): Response<LoginResponse> => {
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
        return {
            status: Status.Failed,
            code: ErrorCode.UserNotFound,
        };
    }

    if (loginSource === LoginPlatform.WeChat) {
        const refreshToken = await redisService.get(RedisKey.wechatRefreshToken(userUUID));

        if (refreshToken === null) {
            return {
                status: Status.AuthFailed,
                code: ErrorCode.NeedLoginAgain,
            };
        }

        try {
            const renewAccessTokenURL = renewAccessToken(refreshToken);
            await wechatRequest<RefreshToken>(renewAccessTokenURL);
        } catch (e: unknown) {
            console.error((e as Error).message);
            return {
                status: Status.AuthFailed,
                code: ErrorCode.CanRetry,
            };
        }

        return {
            status: Status.Success,
            data: {
                name: userInfoInstance.user_name,
                sex: userInfoInstance.sex,
                avatar: userInfoInstance.avatar_url,
                userUUID,
            },
        };
    }

    return {
        status: Status.AuthFailed,
        code: ErrorCode.UnsupportedPlatform,
    };
};

interface LoginResponse {
    name: string;
    sex: Sex;
    avatar: string;
    userUUID: string;
}
