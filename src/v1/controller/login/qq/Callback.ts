import { v4 } from "uuid";
import { FastifySchema, ResponseError } from "../../../../types/Server";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { parseError } from "../../../../logger";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { QQ } from "../../../../constants/Config";
import { LoginQQ } from "../platforms/LoginQQ";
import { ServiceUserQQ } from "../../../service/user/UserQQ";
import { LoginPlatform } from "../../../../constants/Project";
import { failedHTML, successHTML } from "../utils/callbackHTML";

@Controller<RequestType, any>({
    method: "get",
    path: "login/qq/callback",
    auth: false,
    skipAutoHandle: true,
    enable: QQ.enable,
})
export class QQWebCallback extends AbstractController<RequestType> {
    public static readonly schema: FastifySchema<RequestType> = {
        querystring: {
            type: "object",
            required: ["state", "code"],
            properties: {
                state: {
                    type: "string",
                    format: "uuid-v4",
                },
                code: {
                    type: "string",
                },
                platform: {
                    type: "string",
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<void> {
        void this.reply.headers({
            "content-type": "text/html",
        });
        void this.reply.send();

        const { state: authUUID, platform, code } = this.querystring;

        await LoginQQ.assertHasAuthUUID(authUUID, this.logger);

        const userInfo = await LoginQQ.getUserInfoAndToken(code);

        const userUUIDByDB = await ServiceUserQQ.userUUIDByUnionUUID(userInfo.unionUUID);

        const userUUID = userUUIDByDB || v4();

        const loginQQ = new LoginQQ({
            userUUID,
        });

        if (!userUUIDByDB) {
            await loginQQ.register(userInfo);
        }

        const { userName, avatarURL } = !userUUIDByDB
            ? userInfo
            : (await loginQQ.svc.user.nameAndAvatar())!;

        await loginQQ.tempSaveUserInfo(authUUID, {
            name: userName,
            token: await this.reply.jwtSign({
                userUUID,
                loginSource: LoginPlatform.QQ,
            }),
            avatar: avatarURL,
        });

        return this.reply.send(successHTML(platform !== "web"));
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        await redisService.set(RedisKey.authFailed(this.querystring.state), error.message, 60 * 60);

        this.logger.error("request failed", parseError(error));
        return this.reply.send(failedHTML());
    }
}

interface RequestType {
    querystring: {
        state: string;
        code: string;
        platform: string;
    };
}
