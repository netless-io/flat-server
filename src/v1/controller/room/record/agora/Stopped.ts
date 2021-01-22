import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordStoppedResponse,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordStoppedRequest } from "../../../../utils/request/agora/Agora";
import { getConnection } from "typeorm";
import { getCloudRecordData } from "../../utils/Agora";

export const recordAgoraStopped = async (
    req: PatchRequest<{
        Body: RecordAgoraStoppedBody;
    }>,
): Response<AgoraCloudRecordStoppedResponse> => {
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

        let agoraResponse: AgoraCloudRecordStoppedResponse;
        await getConnection().transaction(async t => {
            await RoomRecordDAO(t).update(
                {
                    end_time: new Date(),
                },
                {
                    agora_sid: agoraParams.sid,
                },
            );

            const { uid, cname } = await getCloudRecordData(roomUUID, false);

            agoraResponse = await agoraCloudRecordStoppedRequest(agoraParams, {
                uid,
                cname,
                clientRequest: {},
            });
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

interface RecordAgoraStoppedBody {
    roomUUID: string;
    agoraParams: AgoraCloudRecordParamsType;
}

export const recordAgoraStoppedSchemaType: FastifySchema<{
    body: RecordAgoraStoppedBody;
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
