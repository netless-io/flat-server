import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import {
    AgoraCloudRecordParamsType,
    AgoraCloudRecordStoppedResponse as ResponseType,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordStoppedRequest } from "../../../../utils/request/agora/Agora";
import { getConnection } from "typeorm";
import { getCloudRecordData } from "../../utils/Agora";
import { AbstractController } from "../../../../../abstract/Controller";
import { Controller } from "../../../../../decorator/Controller";

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

    public async execute(): Promise<Response<ResponseType>> {
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

        let agoraResponse: ResponseType;
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
