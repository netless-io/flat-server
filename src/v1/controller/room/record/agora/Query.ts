import { Controller, FastifySchema } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordQueryResponse,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordQueryRequest } from "../../../../utils/request/agora/Agora";
import { parseError } from "../../../../../Logger";

export const recordAgoraQuery: Controller<
    RecordAgoraQueryRequest,
    AgoraCloudRecordQueryResponse<"string" | "json" | undefined>
> = async ({ req, logger }) => {
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
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface RecordAgoraQueryRequest {
    body: {
        roomUUID: string;
        agoraParams: AgoraCloudRecordParamsType;
    };
}

export const recordAgoraQuerySchemaType: FastifySchema<RecordAgoraQueryRequest> = {
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
