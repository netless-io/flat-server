import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Agora } from "../../../../../constants/Process";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/Room";
import {
    AgoraCloudRecordParamsBaseType,
    AgoraCloudRecordStartedRequestBody,
    AgoraCloudRecordStartedResponse as ResponseType,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordStartedRequest } from "../../../../utils/request/agora/Agora";
import { getConnection } from "typeorm";
import { getCloudRecordData } from "../../utils/Agora";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/record/agora/started",
    auth: true,
})
export class RecordAgoraStarted extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
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
                    required: ["clientRequest"],
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

        let agoraResponse: ResponseType;
        await getConnection().transaction(async t => {
            const { uid, cname, token } = await getCloudRecordData(roomUUID, true);

            agoraResponse = await agoraCloudRecordStartedRequest(agoraParams, {
                uid,
                cname,
                clientRequest: {
                    ...agoraData.clientRequest,
                    token,
                    storageConfig: {
                        vendor: Number(Agora.OSS_VENDOR),
                        region: Number(Agora.OSS_REGION),
                        bucket: Agora.OSS_BUCKET,
                        accessKey: Agora.OSS_ACCESS_KEY_ID,
                        secretKey: Agora.OSS_ACCESS_KEY_SECRET,
                        fileNamePrefix: [Agora.OSS_FOLDER, roomUUID.replace(/-/g, "")],
                    },
                },
            });

            const currentTime = new Date();
            await RoomRecordDAO(t).insert({
                room_uuid: roomUUID,
                begin_time: currentTime,
                end_time: currentTime,
                agora_sid: agoraResponse.sid,
            });
        });

        return {
            status: Status.Success,
            // @ts-ignore
            data: agoraResponse,
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.currentProcessFailed(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
        agoraParams: AgoraCloudRecordParamsBaseType;
        agoraData: AgoraCloudRecordStartedRequestBody;
    };
}
