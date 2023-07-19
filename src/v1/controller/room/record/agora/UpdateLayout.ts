import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/RoomStatus";
import { agoraCloudRecordUpdateLayoutRequest } from "../../../../utils/request/agora/Agora";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordUpdateLayoutRequestBody,
    AgoraCloudRecordUpdateLayoutResponse as ResponseType,
} from "../../../../utils/request/agora/Types";
import { getCloudRecordData } from "../../utils/Agora";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/record/agora/update-layout",
    auth: true,
})
export class RecordAgoraUpdateLayout extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID", "agoraParams", "agoraData"],
            properties: {
                roomUUID: {
                    type: "string",
                },
                agoraParams: {
                    type: "object",
                    required: ["resourceid", "mode"],
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
                agoraData: {
                    type: "object",
                    // there are too many parameters and they are only used for forwarding, so there is no more verification here
                    required: [],
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID, agoraParams, agoraData } = this.body;
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
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
        agoraParams: AgoraCloudRecordParamsType;
        agoraData: AgoraCloudRecordUpdateLayoutRequestBody;
    };
}
