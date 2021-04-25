import redisService from "../../../thirdPartyService/RedisService";
import { Status } from "../../../constants/Project";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { RedisKey } from "../../../utils/Redis";
import { ErrorCode } from "../../../ErrorCode";
import { UserDAO, UserGithubDAO, UserWeChatDAO } from "../../../dao";
import { LoginPlatform } from "../../../constants/Project";
import { getGithubUserInfo } from "../../utils/request/github/GithubRequest";
import { weChatRenewAccessToken } from "../../utils/request/wechat/WeChatRequest";

export const login = async (
    req: PatchRequest<{
        Body: LoginBody;
    }>,
): Response<LoginResponse> => {
    const { userUUID, loginSource } = req.user;
    const { type } = req.body;

    try {
        const userInfoInstance = await UserDAO().findOne(["user_name", "avatar_url"], {
            user_uuid: userUUID,
        });

        if (userInfoInstance === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }

        switch (loginSource) {
            case LoginPlatform.WeChat: {
                const weChatUserInfo = await UserWeChatDAO().findOne(["id"], {
                    user_uuid: userUUID,
                });

                if (weChatUserInfo === undefined) {
                    return {
                        status: Status.Failed,
                        code: ErrorCode.UserNotFound,
                    };
                }

                const refreshToken = await redisService.get(RedisKey.wechatRefreshToken(userUUID));

                if (refreshToken === null) {
                    return {
                        status: Status.AuthFailed,
                        code: ErrorCode.NeedLoginAgain,
                    };
                }
                await weChatRenewAccessToken(refreshToken, type.toUpperCase() as any);

                return {
                    status: Status.Success,
                    data: {
                        name: userInfoInstance.user_name,
                        avatar: userInfoInstance.avatar_url,
                        userUUID,
                    },
                };
            }
            case LoginPlatform.Github: {
                const githubUserInfo = await UserGithubDAO().findOne(
                    ["union_uuid", "access_token"],
                    {
                        user_uuid: userUUID,
                    },
                );

                if (githubUserInfo === undefined) {
                    return {
                        status: Status.Failed,
                        code: ErrorCode.UserNotFound,
                    };
                }

                const { id: union_uuid } = await getGithubUserInfo(githubUserInfo.access_token);

                if (String(union_uuid) !== githubUserInfo.union_uuid) {
                    return {
                        status: Status.AuthFailed,
                        code: ErrorCode.NeedLoginAgain,
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
        }

        return {
            status: Status.AuthFailed,
            code: ErrorCode.UnsupportedPlatform,
        };
    } catch (e: unknown) {
        console.error((e as Error).message);
        return {
            status: Status.AuthFailed,
            code: ErrorCode.ServerFail,
        };
    }
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
