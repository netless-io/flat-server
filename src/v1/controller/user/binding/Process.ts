import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { Status } from "../../../../constants/Project";
import { ControllerError } from "../../../../error/ControllerError";

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

        if (bindingAuthStatus !== "true" && bindingAuthStatus !== "false") {
            throw new ControllerError(Number(bindingAuthStatus));
        }

        return {
            status: Status.Success,
            data: {
                status: bindingAuthStatus === "true",
            },
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

type ResponseType = {
    status: boolean;
};
