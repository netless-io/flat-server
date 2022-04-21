import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ServiceRoomUser } from "../../../service";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/deleteAccount/validate",
    auth: true,
})
export class DeleteAccountValidate extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {};

    public async execute(): Promise<Response<ResponseType>> {
        const alreadyJoinedRoomCount = await ServiceRoomUser.joinCount(this.userUUID);

        return {
            status: Status.Success,
            data: {
                alreadyJoinedRoomCount,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {}

interface ResponseType {
    alreadyJoinedRoomCount: number;
}
