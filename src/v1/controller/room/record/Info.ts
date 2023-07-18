import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Agora } from "../../../../constants/Config";
import { Region, Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO } from "../../../../dao";
import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { getRTMToken } from "../../../utils/AgoraToken";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/record/info",
    auth: true,
})
export class RecordInfo extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID"],
            properties: {
                roomUUID: {
                    type: "string",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID } = this.body;
        const userUUID = this.userUUID;

        const roomInfo = await RoomDAO().findOne(
            ["room_status", "whiteboard_room_uuid", "room_type", "title", "owner_uuid", "region"],
            {
                room_uuid: roomUUID,
            },
        );

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (roomInfo.room_status !== RoomStatus.Stopped) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotIsEnded,
            };
        }

        const roomRecordInfo = await RoomRecordDAO().find(["begin_time", "end_time", "agora_sid"], {
            room_uuid: roomUUID,
        });

        if (roomRecordInfo.length === 0) {
            return {
                status: Status.Failed,
                code: ErrorCode.RecordNotFound,
            };
        }

        const {
            title,
            owner_uuid: ownerUUID,
            room_type: roomType,
            whiteboard_room_uuid: whiteboardRoomUUID,
            region,
        } = roomInfo;

        const resourcesURLPrefix = `${Agora.ossPrefix}/${Agora.ossFolder}/${roomUUID.replace(
            /-/g,
            "",
        )}`;

        return {
            status: Status.Success,
            data: {
                title,
                ownerUUID,
                roomType,
                region,
                whiteboardRoomUUID,
                whiteboardRoomToken: createWhiteboardRoomToken(whiteboardRoomUUID, {
                    readonly: true,
                }),
                rtmToken: await getRTMToken(userUUID),
                recordInfo: roomRecordInfo.map(({ begin_time, end_time, agora_sid }) => ({
                    beginTime: begin_time.valueOf(),
                    endTime: end_time.valueOf(),
                    videoURL: agora_sid
                        ? `${resourcesURLPrefix}/${agora_sid}_${roomUUID}.m3u8`
                        : "",
                    resourcesURLPrefix,
                    agoraSID: agora_sid,
                })),
            },
        };
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

interface ResponseType {
    title: string;
    ownerUUID: string;
    roomType: RoomType;
    region: Region;
    whiteboardRoomToken: string;
    whiteboardRoomUUID: string;
    rtmToken: string;
    recordInfo: Array<{
        beginTime: number;
        endTime: number;
        videoURL: string;
        resourcesURLPrefix: string;
        agoraSID: string;
    }>;
}
