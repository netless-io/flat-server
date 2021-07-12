import { Status } from "../../../../constants/Project";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { getRTMToken } from "../../../utils/AgoraToken";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<null, ResponseType>({
    method: "post",
    path: "agora/token/generate/rtm",
    auth: true,
})
export class GenerateRTM extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<null> = null;

    public async execute(): Promise<Response<ResponseType>> {
        const token = await getRTMToken(this.userUUID);

        return {
            status: Status.Success,
            data: {
                token,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {}

interface ResponseType {
    token: string;
}
