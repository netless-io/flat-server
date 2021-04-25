import { FastifySchema, PatchRequest, Response } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordQueryResponse,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordQueryRequest } from "../../../../utils/request/agora/Agora";

export const recordAgoraQuery = async (
    req: PatchRequest<{
        Body: RecordAgoraQueryBody;
    }>,
): Response<AgoraCloudRecordQueryResponse<"string" | "json" | undefined>> => {
    const { roomUUID, agoraParams } = req.body;
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

        const agoraResponse = await agoraCloudRecordQueryRequest(agoraParams);

        return {
            status: Status.Success,
            data: agoraResponse,
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface RecordAgoraQueryBody {
    roomUUID: string;
    agoraParams: AgoraCloudRecordParamsType;
}

export const recordAgoraQuerySchemaType: FastifySchema<{
    body: RecordAgoraQueryBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID", "agoraParams"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
            agoraParams: {
                type: "object",
                required: ["resourceid", "mode", "sid"],
                resourceid: {
                    type: "string",
                },
                mode: {
                    type: "string",
                },
                sid: {
                    type: "string",
                },
            },
        },
    },
};
