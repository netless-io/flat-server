import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/RoomStatus";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordQueryResponse,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordQueryRequest } from "../../../../utils/request/agora/Agora";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/record/agora/query",
    auth: true,
})
export class RecordAgoraQuery extends AbstractController<RequestType, ResponseType> {
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

    public async execute(): Promise<
        Response<AgoraCloudRecordQueryResponse<"string" | "json" | undefined>>
    > {
        const { roomUUID, agoraParams } = this.body;
        const userUUID = this.userUUID;

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

        const { serverResponse } = agoraResponse;
        const isRecording = 1 <= serverResponse.status && serverResponse.status <= 5;
        if (isRecording) {
            await RedisService.set(
                RedisKey.record(roomUUID),
                JSON.stringify({
                    resourceid: agoraResponse.resourceId,
                    sid: agoraResponse.sid,
                    mode: agoraParams.mode,
                }),
                // Agora cloud recording automatically stops after 24 hours
                60 * 60 * 24 * 2,
            );
        } else {
            await RedisService.del(RedisKey.record(roomUUID));
        }

        return {
            status: Status.Success,
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

type ResponseType = AgoraCloudRecordQueryResponse<"string" | "json" | undefined>;
