import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordQueryResponse,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordQueryRequest } from "../../../../utils/request/agora/Agora";
import { AbstractController } from "../../../../../abstract/Controller";
import { Controller } from "../../../../../decorator/Controller";

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
