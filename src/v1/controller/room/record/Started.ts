import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/RoomStatus";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/record/started",
    auth: true,
})
export class RecordStarted extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID"],
            properties: {
                roomUUID: {
                    type: "string",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID } = this.body;
        const userUUID = this.userUUID;

        const roomInfo = await RoomDAO().findOne(["has_record", "room_status"], {
            room_uuid: roomUUID,
            owner_uuid: userUUID,
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (!roomIsRunning(roomInfo.room_status)) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotIsRunning,
            };
        }

        const currentTime = new Date();
        await RoomRecordDAO().insert({
            room_uuid: roomUUID,
            begin_time: currentTime,
            end_time: currentTime,
        });
        if (!roomInfo.has_record) {
            await RoomDAO().update(
                {
                    has_record: true,
                },
                {
                    room_uuid: roomUUID,
                },
                ["id", "ASC"],
                1,
            );
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
        roomUUID: string;
    };
}

interface ResponseType {}
