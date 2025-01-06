import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomUserDAO } from "../../../../dao";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";

@Controller<RequestType, any>({
    method: "post",
    path: "user/grade/set",
    auth: true,
})
export class SetGrade extends AbstractController<RequestType, any> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID", "userUUID", "grade"],
            properties: {
                roomUUID: {
                    type: "string",
                },
                userUUID: {
                    type: "string",
                },
                grade: {
                    type: "integer",
                    minimum: 0,
                    maximum: 5,
                }
            },
        },
    };

    public async execute(): Promise<Response<any>> {
        const { roomUUID, userUUID, grade } = this.body;

        const roomUserInfo = await RoomUserDAO().findOne(["id"], {
            user_uuid: userUUID,
            room_uuid: roomUUID,
        });

        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }
        
        await RoomUserDAO().update({
            grade,
        },{
            room_uuid: roomUUID,
            user_uuid: userUUID,
        });

        return {
            status: Status.Success,
            data: null,
        };
        
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
        userUUID: string;
        grade: number;
    };
}