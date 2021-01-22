import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordQueryResponse,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordQueryRequest } from "../../../../utils/request/agora/Agora";
import { getConnection } from "typeorm";

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

        let agoraResponse: AgoraCloudRecordQueryResponse<"string" | "json" | undefined>;
        await getConnection().transaction(async t => {
            // if the teacher is disconnected unexpectedly, the last query time will be used as the end time
            // no need to care when agora's service is closed. When no query request is sent for a period of time, agora will automatically consider it to be over
            await RoomRecordDAO(t).update(
                {
                    end_time: new Date(),
                },
                {
                    agora_sid: agoraParams.sid,
                },
            );

            agoraResponse = await agoraCloudRecordQueryRequest(agoraParams);
        });

        return {
            status: Status.Success,
            // @ts-ignore
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
