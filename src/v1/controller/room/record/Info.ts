import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { Agora, Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO, RoomUserDAO } from "../../../dao";
import { RoomStatus, RoomType } from "../Constants";

export const recordInfo = async (
    req: PatchRequest<{
        Body: RecordInfoBody;
    }>,
): Response<RecordInfoResponse> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomUserInfo = await RoomUserDAO().findOne(["id"], {
            room_uuid: roomUUID,
            user_uuid: userUUID,
        });

        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const roomInfo = await RoomDAO().findOne(["room_status", "room_type", "title"], {
            room_uuid: roomUUID,
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (roomInfo.room_status !== RoomStatus.Stopped) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotIsEnded,
            };
        }

        const roomRecordInfo = await RoomRecordDAO().find(["begin_time", "end_time", "agora_sid"], {
            room_uuid: roomUUID,
        });

        if (roomRecordInfo.length === 0) {
            return {
                status: Status.Failed,
                code: ErrorCode.RecordNotFound,
            };
        }

        return {
            status: Status.Success,
            data: {
                title: roomInfo.title,
                roomType: roomInfo.room_type,
                recordInfo: roomRecordInfo.map(({ begin_time, end_time, agora_sid }) => ({
                    beginTime: begin_time.toISOString(),
                    endTime: end_time.toISOString(),
                    agoraSID: agora_sid,
                    videoURL: `${Agora.OSS_PREFIX}/${Agora.OSS_FOLDER}/${agora_sid}_${roomUUID}.m3u8`,
                })),
            },
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface RecordInfoBody {
    roomUUID: string;
}

export const recordInfoSchemaType: FastifySchema<{
    body: RecordInfoBody;
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

interface RecordInfoResponse {
    title: string;
    roomType: RoomType;
    recordInfo: Array<{
        beginTime: string;
        endTime: string;
        agoraSID: string;
    }>;
}
