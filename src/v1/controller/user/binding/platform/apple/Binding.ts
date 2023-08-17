import jwt from "fast-jwt";
import { AbstractController } from "../../../../../../abstract/controller";
import { Apple } from "../../../../../../constants/Config";
import { Status } from "../../../../../../constants/Project";
import { UserDAO } from "../../../../../../dao";
import { Controller } from "../../../../../../decorator/Controller";
import { ControllerError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";
import { FastifySchema, Response, ResponseError } from "../../../../../../types/Server";
import { ServiceUserApple } from "../../../../../service/user/UserApple";
import { AppleJWTToken, LoginApple } from "../../../../login/platforms/LoginApple";

@Controller<RequestType, any>({
    method: "post",
    path: "user/binding/platform/apple",
    auth: true,
    enable: Apple.enable,
})
export class BindingApple extends AbstractController<RequestType, any> {
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

    private svc = {
        userApple: new ServiceUserApple(this.userUUID),
    };

    public async execute(): Promise<Response> {
        const { jwtToken, nickname } = this.body;

        await LoginApple.assertJWTTokenCorrect(jwtToken);

        const token = jwt.createDecoder({
            complete: true,
        })(jwtToken) as AppleJWTToken;

        const appleID = token.payload.sub;

        const userUUIDByDB = await ServiceUserApple.userUUIDByUnionUUID(appleID);
        if (userUUIDByDB) {
            throw new ControllerError(ErrorCode.UserAlreadyBinding);
        }

        const userUUID = this.userUUID;
        const userInfo = await UserDAO().findOne(["user_name"], {
            user_uuid: userUUID,
        });

        if (userInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }

        await this.svc.userApple.create({
            unionUUID: appleID,
            // Apple nickname will only exist at the first registration
            // so basically there must be a nickname here
            // also to be on the conservative side, additional judgement logic has been added here
            userName: nickname || userInfo.user_name,
        });

        return {
            status: Status.Success,
            data: {},
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
