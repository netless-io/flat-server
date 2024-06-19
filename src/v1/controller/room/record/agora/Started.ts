import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Agora } from "../../../../../constants/Config";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../../dao";
import { roomIsRunning } from "../../utils/RoomStatus";
import {
    AgoraCloudRecordParamsBaseType,
    AgoraCloudRecordStartedRequestBody,
    AgoraCloudRecordStartedResponse as ResponseType,
} from "../../../../utils/request/agora/Types";
import { agoraCloudRecordStartedRequest } from "../../../../utils/request/agora/Agora";
import { getCloudRecordData } from "../../utils/Agora";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";

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

        // Limit width less than 1920 and greater than 96, height less than 1080 and greater than 96.
        const transcodingConfig = agoraData.clientRequest.recordingConfig?.transcodingConfig;
        if (transcodingConfig) {
            let { width, height } = transcodingConfig;
            let shouldUpdate = false;
            const minLength = 96;
            if (width > 1920 || height > 1080 || width < minLength || height < minLength) {
                if (width > 1920) {
                    height = Math.floor((height * 1920) / width);
                    width = 1920;
                }
                if (height > 1080) {
                    width = Math.floor((width * 1080) / height);
                    height = 1080;
                }
                if (width < minLength) {
                    height = Math.floor((height * minLength) / width);
                    width = minLength;
                }
                if (height < minLength) {
                    width = Math.floor((width * minLength) / height);
                    height = minLength;
                }
                if (width > 1920) {
                    width = 1920;
                }
                if (height > 1080) {
                    height = 1080;
                }
                shouldUpdate = true;
            }
            if (shouldUpdate && agoraData.clientRequest.recordingConfig) {
                agoraData.clientRequest.recordingConfig.transcodingConfig = {
                    ...transcodingConfig,
                    width,
                    height,
                };
            }
        }

        const roomInfo = await RoomDAO().findOne(["room_status", "has_record"], {
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
        await dataSource.transaction(async t => {
            const { uid, cname, token } = await getCloudRecordData(roomUUID, true);

            agoraResponse = await agoraCloudRecordStartedRequest(agoraParams, {
                uid,
                cname,
                clientRequest: {
                    ...agoraData.clientRequest,
                    token,
                    storageConfig: {
                        vendor: Number(Agora.ossVendor),
                        region: Number(Agora.ossRegion),
                        bucket: Agora.ossBucket,
                        accessKey: Agora.ossAccessKeyId,
                        secretKey: Agora.ossAccessKeySecret,
                        fileNamePrefix: [Agora.ossFolder, roomUUID.replace(/-/g, "")],
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

            if (!roomInfo.has_record) {
                await RoomDAO().update(
                    {
                        has_record: true,
                    },
                    {
                        room_uuid: roomUUID,
                    },
                    ["id", "ASC"],
                    1,
                );
            }

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
        agoraParams: AgoraCloudRecordParamsBaseType;
        agoraData: AgoraCloudRecordStartedRequestBody;
    };
}
