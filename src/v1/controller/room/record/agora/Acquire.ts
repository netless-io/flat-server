import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/RoomStatus";
import { agoraCloudRecordAcquireRequest } from "../../../../utils/request/agora/Agora";
import {
    AgoraCloudRecordAcquireRequestBody,
    AgoraCloudRecordAcquireResponse as ResponseType,
} from "../../../../utils/request/agora/Types";
import { getCloudRecordData } from "../../utils/Agora";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/record/agora/acquire",
    auth: true,
})
export class RecordAgoraAcquire extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID", "agoraData"],
            properties: {
                roomUUID: {
                    type: "string",
                },
                agoraData: {
                    type: "object",
                    // there are too many parameters and they are only used for forwarding, so there is no more verification here
                    required: ["clientRequest"],
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID, agoraData } = this.body;
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

        const agoraResponse = await agoraCloudRecordAcquireRequest({
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
        agoraData: AgoraCloudRecordAcquireRequestBody;
    };
}
