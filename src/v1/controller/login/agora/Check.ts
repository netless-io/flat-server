import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { RedisKey } from "../../../../utils/Redis";
import { ErrorCode } from "../../../../ErrorCode";
import { ControllerError } from "../../../../error/ControllerError";
import { LoginAgora } from "../platforms/LoginAgora";
import { LoginPlatform, Status } from "../../../../constants/Project";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "login/agora/check",
    auth: false,
})
export class CheckAgoraSSOLoginID extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["loginID"],
            properties: {
                loginID: {
                    type: "string",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { loginID } = this.body;

        if (!loginID) {
            throw new ControllerError(ErrorCode.NeedLoginAgain);
        }

        const userUUID = RedisKey.agoraSSOLoginID(loginID);

        if (!userUUID) {
            throw new ControllerError(ErrorCode.NeedLoginAgain);
        }

        const isValid = await LoginAgora.checkLoginID(loginID);

        if (!isValid) {
            throw new ControllerError(ErrorCode.NeedLoginAgain);
        }

        return {
            status: Status.Success,
            data: {
                jwtToken: await this.reply.jwtSign({
                    userUUID,
                    loginSource: LoginPlatform.Agora,
                }),
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        loginID: string;
    };
}

interface ResponseType {
    jwtToken: string;
}
