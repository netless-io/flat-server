import { Status } from "../../../../constants/Project";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { aliGreenText } from "../../../utils/AliGreen";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "agora/rtm/censor",
    auth: true,
})
export class RTMCensor extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["text"],
            properties: {
                text: {
                    type: "string",
                    maxLength: 300,
                    minLength: 1,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        return {
            status: Status.Success,
            data: {
                valid: !(await aliGreenText.textNonCompliant(this.body.text)),
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        text: string;
    };
}

interface ResponseType {
    valid: boolean;
}
