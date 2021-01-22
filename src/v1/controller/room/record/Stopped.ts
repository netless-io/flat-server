import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../dao";
import { roomIsRunning } from "../utils/Room";

export const recordStopped = async (
    req: PatchRequest<{
        Body: RecordStoppedBody;
    }>,
): Response<RecordStoppedResponse> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomInfo = await RoomDAO().findOne(["room_status"], {
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

        await RoomRecordDAO().update(
            {
                end_time: new Date(),
            },
            {
                room_uuid: roomUUID,
            },
            ["created_at", "DESC"],
            1,
        );

        return {
            status: Status.Success,
            data: {},
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface RecordStoppedBody {
    roomUUID: string;
}

export const recordStoppedSchemaType: FastifySchema<{
    body: RecordStoppedBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};

interface RecordStoppedResponse {}
