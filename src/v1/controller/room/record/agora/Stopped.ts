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
import { Agora } from "../../../../../constants/Config";
import { RoomUserModel } from "../../../../../model/room/RoomUser";
import { isExistObject } from "../../../cloudStorage/alibabaCloud/Utils";
import { patchForM3U8 } from "../PatchForAgoraM3U8";

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

        let agoraResponse: ResponseType;
        await dataSource.transaction(async t => {
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

        await this.patchForAgoraRecordM3U8Files();
        return {
            status: Status.Success,
            // @ts-ignore
            data: agoraResponse,
        };
    }

    async patchForAgoraRecordM3U8Files(): Promise<void> {
        const { roomUUID } = this.body;
        const roomUsersInfoBasic = dataSource
            .createQueryBuilder(RoomUserModel, "ru")
            .addSelect("ru.rtc_uid", "rtc_uid")
            .andWhere("room_uuid = :roomUUID", {
                roomUUID,
            })
            .andWhere("ru.is_delete = false");

        const roomUsersRtcInfo = await roomUsersInfoBasic.getRawMany<RoomUsersRtcUIDInfo>();
        const resourcePath = `/${Agora.ossFolder}/${roomUUID.replace(/-/g, "")}`;

        const recordInfo = await RoomRecordDAO().findOne(["agora_sid"], {
            room_uuid: roomUUID,
        });
        if (recordInfo === undefined) {
            throw new Error("record info not found");
        }
        const allRoomUsersRtcRecordPath = roomUsersRtcInfo.map(({ rtc_uid }) => {
            const agoraResourceURL = `${recordInfo.agora_sid}_${roomUUID}__uid_s_${rtc_uid}__uid_e_av.m3u8`;
            return agoraResourceURL;
        });
        const existedUsersRecordPath = allRoomUsersRtcRecordPath.filter(async url => {
            const fullPath = `${resourcePath}/${url}`;
            const urlExist = await isExistObject(fullPath);
            return urlExist;
        });

        for (const userPath of existedUsersRecordPath) {
            await patchForM3U8(userPath, resourcePath);
        }
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

type RoomUsersRtcUIDInfo = Pick<RoomUserModel, "rtc_uid">;
