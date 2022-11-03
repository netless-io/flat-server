import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/RoomStatus";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { patchForM3U8 } from "./PatchForAgoraM3U8";
import { RoomUserModel } from "../../../../model/room/RoomUser";
import { Agora } from "../../../../constants/Config";
import { isExistObject } from "../../cloudStorage/alibabaCloud/Utils";

@Controller<RequestType, ResponseType>({
    method: "post",
    // the logic here is consistent with room/record/stopped
    path: ["room/record/stopped", "room/record/update-end-time"],
    auth: true,
})
export class RecordStopped extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID"],
            properties: {
                roomUUID: {
                    type: "string",
                    format: "uuid-v4",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID } = this.body;
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

        await RoomRecordDAO().update(
            {
                end_time: new Date(),
            },
            {
                room_uuid: roomUUID,
            },
            ["created_at", "DESC"],
            1,
        );

        await this.patchForAgoraRecordM3U8Files();
        return {
            status: Status.Success,
            data: {},
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
    };
}

interface ResponseType {}

type RoomUsersRtcUIDInfo = Pick<RoomUserModel, "rtc_uid">;
