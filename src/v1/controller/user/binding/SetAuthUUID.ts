import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/binding/set-auth-uuid",
    auth: true,
})
export class SetAuthUUID extends AbstractController<RequestType, ResponseType> {
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

        const result = await redisService.set(
            RedisKey.bindingAuthUUID(authUUID),
            this.userUUID,
            60 * 60,
        );

        if (result === null) {
            return {
                status: Status.Failed,
                code: ErrorCode.ServerFail,
            };
        } else {
            return {
                status: Status.Success,
                data: {},
            };
        }
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
