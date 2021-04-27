import { Controller, FastifySchema } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import { agoraCloudRecordUpdateLayoutRequest } from "../../../../utils/request/agora/Agora";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordUpdateLayoutRequestBody,
    AgoraCloudRecordUpdateLayoutResponse,
} from "../../../../utils/request/agora/Types";
import { getCloudRecordData } from "../../utils/Agora";
import { parseError } from "../../../../../Logger";

export const recordAgoraUpdateLayout: Controller<
    RecordAgoraUpdateLayoutRequest,
    AgoraCloudRecordUpdateLayoutResponse
> = async ({ req, logger }) => {
    const { roomUUID, agoraParams, agoraData } = req.body;
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

        const agoraResponse = await agoraCloudRecordUpdateLayoutRequest(agoraParams, {
            uid,
            cname,
            clientRequest: agoraData.clientRequest,
        });

        return {
            status: Status.Success,
            data: agoraResponse,
        };
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface RecordAgoraUpdateLayoutRequest {
    body: {
        roomUUID: string;
        agoraParams: AgoraCloudRecordParamsType;
        agoraData: AgoraCloudRecordUpdateLayoutRequestBody;
    };
}

export const recordAgoraUpdateLayoutSchemaType: FastifySchema<RecordAgoraUpdateLayoutRequest> = {
    body: {
        type: "object",
        required: ["roomUUID", "agoraParams", "agoraData"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
            agoraParams: {
                type: "object",
                required: ["resourceid", "mode"],
                resourceid: {
                    type: "string",
                },
                mode: {
                    type: "string",
                },
            },
            agoraData: {
                type: "object",
                // there are too many parameters and they are only used for forwarding, so there is no more verification here
                required: [],
            },
        },
    },
};
