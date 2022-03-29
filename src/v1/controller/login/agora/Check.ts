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
    public static readonly schema: FastifySchema<RequestType> = {};

    public async execute(): Promise<Response<ResponseType>> {
        const loginId = this.req.cookies.agora_sso_id as string | undefined;

        if (!loginId) {
            throw new ControllerError(ErrorCode.NeedLoginAgain);
        }

        const userUUID = RedisKey.agoraSSOLoginID(loginId);

        if (!userUUID) {
            throw new ControllerError(ErrorCode.NeedLoginAgain);
        }

        const isValid = await LoginAgora.checkLoginID(loginId);

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

interface RequestType {}

interface ResponseType {
    jwtToken: string;
}
