import redisService from "../../service/RedisService";
import { HTTPValidationRules } from "../../types/Server";
import { Next, Request, Response } from "restify";
import { getWeChatUserInfo } from "../../model/user/WeChat";
import { LoginPlatform, RedisKeyPrefix, Status } from "../../../Constants";
import { getUserInfoURL, renewAccessToken } from "../../utils/WeChatURL";
import { wechatRequest } from "../../utils/WeChatRequest";
import { RefreshToken, UserInfo } from "../../types/WeChatResponse";
import { getUserInfo, updateAvatarURL } from "../../model/user/User";

export const login = async (req: Request, res: Response, next: Next): Promise<void> => {
    const { userID } = req.body as CanLoginBody;

    const userInfo = await getUserInfo(userID);

    if (typeof userInfo === "undefined") {
        res.send({
            status: Status.AuthFailed,
            message: "user does not exist",
        });
        return;
    }

    if (userInfo.last_login_platform === LoginPlatform.WeChat) {
        const weChatUserInfo = await getWeChatUserInfo(userID);

        if (typeof weChatUserInfo === "undefined") {
            res.send({
                status: Status.AuthFailed,
                message: "user does not exist",
            });
            return;
        }

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

        let weChatRequestUserInfo: UserInfo;
        try {
            const renewAccessTokenURL = renewAccessToken(refreshToken);
            const { access_token } = await wechatRequest<RefreshToken>(renewAccessTokenURL);
            const userInfoURL = getUserInfoURL(access_token, weChatUserInfo.open_id);

            weChatRequestUserInfo = await wechatRequest<UserInfo>(userInfoURL);
        } catch (e: unknown) {
            res.send({
                status: Status.AuthFailed,
                message: (e as Error).message,
            });
            return;
        }

        await res.send({
            status: Status.Success,
            data: weChatRequestUserInfo,
        });

        if (userInfo.avatar_url !== weChatRequestUserInfo.headimgurl) {
            updateAvatarURL(weChatRequestUserInfo.headimgurl, userID).catch((e: Error) => {
                console.error(
                    `update user avatar url failed, userID: ${userID}, avatar url: ${weChatRequestUserInfo.headimgurl}`,
                );
                console.error(e.message);
            });
        }
    }

    next();
};

type CanLoginBody = {
    userID: string;
};

export const loginValidationRules: HTTPValidationRules = {
    body: ["userID"],
};
