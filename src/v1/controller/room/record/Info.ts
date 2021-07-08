import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Agora } from "../../../../constants/Process";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomRecordDAO, RoomUserDAO } from "../../../../dao";
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
                    format: "uuid-v4",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID } = this.body;
        const userUUID = this.userUUID;

        const roomUserInfo = await RoomUserDAO().findOne(["id"], {
            room_uuid: roomUUID,
            user_uuid: userUUID,
        });

        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const roomInfo = await RoomDAO().findOne(
            ["room_status", "whiteboard_room_uuid", "room_type", "title", "owner_uuid"],
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
        } = roomInfo;

        return {
            status: Status.Success,
            data: {
                title,
                ownerUUID,
                roomType,
                whiteboardRoomUUID,
                whiteboardRoomToken: createWhiteboardRoomToken(whiteboardRoomUUID, {
                    readonly: true,
                }),
                rtmToken: await getRTMToken(userUUID),
                recordInfo: roomRecordInfo.map(({ begin_time, end_time, agora_sid }) => ({
                    beginTime: begin_time.valueOf(),
                    endTime: end_time.valueOf(),
                    videoURL: agora_sid
                        ? `${Agora.OSS_PREFIX}/${Agora.OSS_FOLDER}/${roomUUID.replace(
                              /-/g,
                              "",
                          )}/${agora_sid}_${roomUUID}.m3u8`
                        : "",
                })),
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.currentProcessFailed(error);
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
    whiteboardRoomToken: string;
    whiteboardRoomUUID: string;
    rtmToken: string;
    recordInfo: Array<{
        beginTime: number;
        endTime: number;
        videoURL: string;
    }>;
}
