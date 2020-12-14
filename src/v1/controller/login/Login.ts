import redisService from "../../service/RedisService";
import { Next, Response } from "restify";
import { getWeChatUserInfo } from "../../model/user/WeChat";
import { LoginPlatform, RedisKeyPrefix, Status } from "../../../Constants";
import { renewAccessToken } from "../../utils/WeChatURL";
import { wechatRequest } from "../../utils/WeChatRequest";
import { RefreshToken } from "../../types/WeChatResponse";
import { getUserInfo } from "../../model/user/User";
import { PatchRequest } from "../../types/Server";
import { UserField, WeChatUserField } from "../../model/types";

export const login = async (req: PatchRequest, res: Response, next: Next): Promise<void> => {
    const { userID, loginSource } = req.user;

    if (loginSource === LoginPlatform.WeChat) {
        const weChatUserInfo = (await getWeChatUserInfo(userID)) as WeChatUserField;

        const refreshToken = await redisService.get(
            `${RedisKeyPrefix.WX_REFRESH_TOKEN}:${weChatUserInfo.id}`,
        );

        if (refreshToken === null) {
            res.send({
                status: Status.AuthFailed,
                message: "The account token has expired, please log in again",
            });
            return;
        }

        try {
            const renewAccessTokenURL = renewAccessToken(refreshToken);
            await wechatRequest<RefreshToken>(renewAccessTokenURL);
        } catch (e: unknown) {
            res.send({
                status: Status.AuthFailed,
                message: (e as Error).message,
            });
            return;
        }

        const userInfo = (await getUserInfo(userID)) as UserField;

        await res.send({
            status: Status.Success,
            data: {
                name: userInfo.name,
                sex: userInfo.sex,
                avatar: userInfo.avatar_url,
            },
        });
    }

    next();
};
