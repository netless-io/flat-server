import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/Room";

export const recordStarted = async (
    req: PatchRequest<{
        Body: RecordStartedBody;
    }>,
): Response<RecordStartedResponse> => {
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

        const currentTime = new Date();
        await RoomRecordDAO().insert({
            room_uuid: roomUUID,
            begin_time: currentTime,
            end_time: currentTime,
        });

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

interface RecordStartedBody {
    roomUUID: string;
}

export const recordStartedSchemaType: FastifySchema<{
    body: RecordStartedBody;
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

interface RecordStartedResponse {}
