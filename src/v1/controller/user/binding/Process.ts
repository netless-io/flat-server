import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { Status } from "../../../../constants/Project";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/binding/process",
    auth: true,
})
export class BindingProcess extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["authUUID"],
            properties: {
                authUUID: {
                    type: "string",
                    format: "uuid-v4",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { authUUID } = this.body;

        const bindingAuthStatus = await RedisService.get(RedisKey.bindingAuthStatus(authUUID));

        this.logger.debug(`binding auth status is: ${String(bindingAuthStatus)}`);

        if (bindingAuthStatus === null) {
            return {
                status: Status.Process,
            };
        }

        if (bindingAuthStatus === "false") {
            throw new ControllerError(ErrorCode.CurrentProcessFailed);
        }

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
        authUUID: string;
    };
}

interface ResponseType {}
