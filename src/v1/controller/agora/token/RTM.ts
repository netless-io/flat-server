import { Status } from "../../../../constants/Project";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { getRTMToken } from "../../../utils/AgoraToken";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { RoomDAO } from "../../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { getClassroomResourceProfile } from "../../../../classroomResource/Registry";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "agora/token/generate/rtm",
    auth: true,
})
export class GenerateRTM extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID"],
            properties: { roomUUID: { type: "string" } },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const room = await RoomDAO().findOne(["classroom_resource_profile_key"], {
            room_uuid: this.body.roomUUID,
        });
        if (!room) {
            return { status: Status.Failed, code: ErrorCode.RoomNotFound };
        }
        const token = await getRTMToken(
            this.userUUID,
            getClassroomResourceProfile(room.classroom_resource_profile_key),
        );

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

interface RequestType {
    body: { roomUUID: string };
}

interface ResponseType {
    token: string;
}
