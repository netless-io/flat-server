import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, ResponseError } from "../../../../types/Server";
import { parseError } from "../../../../logger";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { LoginGoogle } from "../platforms/LoginGoogle";
import { ServiceUserGoogle } from "../../../service/user/UserGoogle";
import { v4 } from "uuid";
import { LoginPlatform } from "../../../../constants/Project";
import { failedHTML, successHTML } from "../utils/callbackHTML";
import { Google } from "../../../../constants/Config";

@Controller<RequestType, any>({
    method: "get",
    path: "login/google/callback",
    auth: false,
    skipAutoHandle: true,
    enable: Google.enable,
})
export class GoogleCallback extends AbstractController<RequestType> {
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

        const { state: authUUID, code, platform } = this.querystring;

        await LoginGoogle.assertHasAuthUUID(authUUID, this.logger);

        const userInfo = await LoginGoogle.getUserInfoAndToken("login", code);

        const userUUIDByDB = await ServiceUserGoogle.userUUIDByUnionUUID(userInfo.unionUUID);

        const userUUID = userUUIDByDB || v4();

        const loginGoogle = new LoginGoogle({
            userUUID,
        });

        if (!userUUIDByDB) {
            await loginGoogle.register(userInfo);
        }

        const { userName, avatarURL } = !userUUIDByDB
            ? userInfo
            : (await loginGoogle.svc.user.nameAndAvatar())!;

        await loginGoogle.tempSaveUserInfo(authUUID, {
            name: userName,
            token: await this.reply.jwtSign({
                userUUID,
                loginSource: LoginPlatform.Google,
            }),
            avatar: avatarURL,
        });

        return this.reply.send(successHTML(platform !== "web"));
    }

    public async errorHandler(error: Error): Promise<ResponseError> {
        this.logger.error("request failed", parseError(error));
        await redisService.set(RedisKey.authFailed(this.querystring.state), "", 60 * 60);

        return this.reply.send(failedHTML());
    }
}

interface RequestType {
    querystring: {
        state: string;
        code: string;
        platform?: "web";
    };
}
