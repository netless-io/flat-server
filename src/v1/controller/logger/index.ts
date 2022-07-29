import { Controller } from "../../../decorator/Controller";
import { AbstractController } from "../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../types/Server";
import { Status } from "../../../constants/Project";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "log",
    auth: false,
})
export class Log extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["message", "type"],
            properties: {
                message: {
                    type: "string",
                },
                type: {
                    type: "string",
                },
            },
        },
    };

    public execute(): Promise<Response<ResponseType>> {
        const { message } = this.body;

        this.logger.warn(message.slice(0, 600));

        return Promise.resolve({
            status: Status.Success,
            data: {},
        });
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        message: string;
        type: string;
    };
}

interface ResponseType {}
