import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO } from "../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import { agoraCloudRecordAcquireRequest } from "../../../../utils/request/agora/Agora";
import {
    AgoraCloudRecordAcquireRequestBody,
    AgoraCloudRecordAcquireResponse,
} from "../../../../utils/request/agora/Types";
import { getCloudRecordData } from "../../utils/Agora";

export const recordAgoraAcquire = async (
    req: PatchRequest<{
        Body: RecordAgoraAcquireBody;
    }>,
): Response<AgoraCloudRecordAcquireResponse> => {
    const { roomUUID, agoraData } = req.body;
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

        const { uid, cname } = await getCloudRecordData(roomUUID, false);

        const agoraResponse = await agoraCloudRecordAcquireRequest({
            uid,
            cname,
            clientRequest: agoraData.clientRequest,
        });

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

interface RecordAgoraAcquireBody {
    roomUUID: string;
    agoraData: AgoraCloudRecordAcquireRequestBody;
}

export const recordAgoraAcquireSchemaType: FastifySchema<{
    body: RecordAgoraAcquireBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID", "agoraData"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
            agoraData: {
                type: "object",
                // there are too many parameters and they are only used for forwarding, so there is no more verification here
                required: ["clientRequest"],
            },
        },
    },
};
