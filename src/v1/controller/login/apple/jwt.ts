import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import jwt from "fast-jwt";
import { AppleJWTToken, LoginApple } from "../platforms/LoginApple";
import { ServiceUserApple } from "../../../service/user/UserApple";
import { v4 } from "uuid";
import { LoginPlatform, Status } from "../../../../constants/Project";
import { Apple } from "../../../../constants/Config";
import { ServiceUserPhone } from "../../../service/user/UserPhone";
import { ServiceUser } from "../../../service/user/User";
import { generateAvatar } from "../../../../utils/Avatar";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "login/apple/jwt",
    auth: false,
    enable: Apple.enable,
})
export class AppleJWT extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["jwtToken"],
            properties: {
                jwtToken: {
                    type: "string",
                },
                nickname: {
                    type: "string",
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { jwtToken, nickname } = this.body;

        await LoginApple.assertJWTTokenCorrect(jwtToken);

        const token = jwt.createDecoder({
            complete: true,
        })(jwtToken) as AppleJWTToken;

        const appleID = token.payload.sub;

        const userUUIDByDB = await ServiceUserApple.userUUIDByUnionUUID(appleID);

        const userUUID = userUUIDByDB || v4();

        const loginApple = new LoginApple({
            userUUID,
        });

        if (!userUUIDByDB) {
            await loginApple.register({
                unionUUID: appleID,
                // apple does not provide the user's avatar information, so the default avatar is used here
                avatarURL: generateAvatar(userUUID),
                // Apple nickname will only exist at the first registration
                // so basically there must be a nickname here
                // also to be on the conservative side, additional judgement logic has been added here
                userName: nickname || "Apple User",
            });
        }

        const { userName, avatarURL } = (await loginApple.svc.user.nameAndAvatar())!;

        return {
            status: Status.Success,
            data: {
                name: userName,
                avatar: avatarURL,
                userUUID,
                token: await this.reply.jwtSign({
                    userUUID,
                    loginSource: LoginPlatform.Apple,
                }),
                hasPhone: await ServiceUserPhone.exist(userUUID),
                hasPassword: await ServiceUser.hasPassword(userUUID),
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        jwtToken: string;
        nickname?: string;
    };
}

interface ResponseType {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
    hasPhone: boolean;
    hasPassword: boolean;
}
