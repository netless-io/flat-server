import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomUserDAO } from "../../../../dao";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/grade/get",
    auth: true,
})
export class GetGrade extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID", "userUUID"],
            properties: {
                roomUUID: {
                    type: "string",
                },
                userUUID: {
                    type: "string",
                }
            },
        },
    };

    public async execute(): Promise<Response<any>> {
        const { roomUUID, userUUID } = this.body;

        const roomUserInfo = await RoomUserDAO().findOne(["grade"], {
            user_uuid: userUUID,
            room_uuid: roomUUID,
        });
        
        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }
        
        return {
            status: Status.Success,
            data: {
                grade: roomUserInfo.grade === -1 ? undefined : roomUserInfo.grade,
            },
        };
        
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}
type ResponseType = {
    grade?: number;
};

interface RequestType {
    body: {
        roomUUID: string;
        userUUID: string;
    };
}