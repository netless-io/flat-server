import redisService from "../../thirdPartyService/RedisService";
import { Status } from "../../../Constants";
import { renewAccessToken } from "../../utils/request/wechat/WeChatURL";
import { wechatRequest } from "../../utils/request/wechat/WeChatRequest";
import { RefreshToken } from "../../types/WeChatResponse";
import { FastifySchema, PatchRequest, Response } from "../../types/Server";
import { LoginPlatform } from "./Constants";
import { RedisKey } from "../../../utils/Redis";
import { ErrorCode } from "../../../ErrorCode";
import { UserDAO, UserWeChatDAO } from "../../dao";

export const login = async (
    req: PatchRequest<{
        Body: LoginBody;
    }>,
): Response<LoginResponse> => {
    const { userUUID, loginSource } = req.user;
    const { type } = req.body;

    const userInfoInstance = await UserDAO().findOne(["user_name", "avatar_url"], {
        user_uuid: userUUID,
    });

    const weChatUserInfo = await UserWeChatDAO().findOne(["id"], {
        user_uuid: userUUID,
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
            const renewAccessTokenURL = renewAccessToken(refreshToken, type.toUpperCase() as any);
            await wechatRequest<RefreshToken>(renewAccessTokenURL);
        } catch (e: unknown) {
            console.error((e as Error).message);
            return {
                status: Status.AuthFailed,
                code: ErrorCode.ServerFail,
            };
        }

        return {
            status: Status.Success,
            data: {
                name: userInfoInstance.user_name,
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

interface LoginBody {
    type: "web" | "mobile";
}

export const loginSchemaType: FastifySchema<{
    body: LoginBody;
}> = {
    body: {
        type: "object",
        required: ["type"],
        properties: {
            type: {
                type: "string",
                enum: ["web", "mobile"],
            },
        },
    },
};

interface LoginResponse {
    name: string;
    avatar: string;
    userUUID: string;
}
