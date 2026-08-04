import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../../dao";
import { roomNotRunning } from "../../utils/RoomStatus";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordStoppedResponse as ResponseType,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordStoppedRequest } from "../../../../utils/request/agora/Agora";
import { getCloudRecordData } from "../../utils/Agora";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { timeExceedRedundancyOneMinute } from "../../utils/CheckTime";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { getClassroomResourceProfile } from "../../../../../classroomResource/Registry";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/record/agora/stopped",
    auth: true,
})
export class RecordAgoraStopped extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID", "agoraParams"],
            properties: {
                roomUUID: {
                    type: "string",
                },
                agoraParams: {
                    type: "object",
                    required: ["resourceid", "mode", "sid"],
                    properties: {
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
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID, agoraParams } = this.body;
        const userUUID = this.userUUID;

        const roomInfo = await RoomDAO().findOne(["room_status", "updated_at"], {
            room_uuid: roomUUID,
            owner_uuid: userUUID,
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (
            roomNotRunning(roomInfo.room_status) &&
            timeExceedRedundancyOneMinute(roomInfo.updated_at.valueOf())
        ) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotIsRunning,
            };
        }

        const record = await RoomRecordDAO().findOne(
            ["classroom_resource_profile_key", "agora_resource_id", "agora_sid"],
            { room_uuid: roomUUID, agora_sid: agoraParams.sid },
        );
        if (!record || (record.agora_resource_id && record.agora_resource_id !== agoraParams.resourceid)) {
            return { status: Status.Failed, code: ErrorCode.RecordNotFound };
        }
        const profile = getClassroomResourceProfile(record.classroom_resource_profile_key);
        const serverParams = {
            ...agoraParams,
            resourceid: record.agora_resource_id || agoraParams.resourceid,
            sid: record.agora_sid,
        };
        let agoraResponse: ResponseType;
        await dataSource.transaction(async t => {
            await RoomRecordDAO(t).update(
                {
                    end_time: new Date(),
                    recording_status: "stopped",
                },
                {
                    agora_sid: agoraParams.sid,
                },
            );

            const { uid, cname } = await getCloudRecordData(roomUUID, false, profile);

            agoraResponse = await agoraCloudRecordStoppedRequest(serverParams, {
                uid,
                cname,
                clientRequest: {},
            }, profile);
        });

        await RedisService.del(RedisKey.record(roomUUID));

        return {
            status: Status.Success,
            // @ts-ignore
            data: agoraResponse,
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
        agoraParams: AgoraCloudRecordParamsType;
    };
}
