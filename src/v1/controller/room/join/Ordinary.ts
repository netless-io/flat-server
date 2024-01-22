import cryptoRandomString from "crypto-random-string";
import { Status } from "../../../../constants/Project";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomStatus } from "../../../../model/room/Constants";
import { ResponseType } from "./Type";
import { getRTCToken, getRTMToken } from "../../../utils/AgoraToken";
import { ErrorCode } from "../../../../ErrorCode";
import { Response } from "../../../../types/Server";
import { RoomDAO, RoomUserDAO } from "../../../../dao";
import { showGuide } from "./Utils";
import { AGORA_SHARE_SCREEN_UID } from "../../../../constants/Agora";
import { Server } from "constants/Config";

export const joinOrdinary = async (
    roomUUID: string,
    userUUID: string,
): Promise<Response<ResponseType>> => {
    const roomInfo = await RoomDAO().findOne(
        [
            "room_status",
            "whiteboard_room_uuid",
            "periodic_uuid",
            "room_type",
            "owner_uuid",
            "region",
            "begin_time",
        ],
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

    if (roomInfo.room_status === RoomStatus.Stopped) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomIsEnded,
        };
    }

    if (roomInfo.begin_time.getTime() - Date.now() > Server.joinEarly * 60 * 1000) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotBegin,
            message: `room(${roomUUID}) is not ready, it will start at ${roomInfo.begin_time.toISOString()}`,
            detail: {
                beginTime: roomInfo.begin_time.getTime(),
                uuid: roomUUID,
                ownerUUID: roomInfo.owner_uuid,
            }
        };
    }

    const { whiteboard_room_uuid: whiteboardRoomUUID } = roomInfo;

    // Either user is joinning a new room or rejoinning a (maybe deleted) room.
    await RoomUserDAO().insert(
        {
            room_uuid: roomUUID,
            user_uuid: userUUID,
            rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
        },
        {
            orUpdate: {
                is_delete: false,
            },
        },
    );

    const roomUserInfo = await RoomUserDAO().findOne(["rtc_uid"], {
        room_uuid: roomUUID,
        user_uuid: userUUID,
    });

    let rtcUID: string;
    if (roomUserInfo !== undefined) {
        rtcUID = roomUserInfo.rtc_uid;
    } else {
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }

    return {
        status: Status.Success,
        data: {
            roomType: roomInfo.room_type,
            roomUUID: roomUUID,
            ownerUUID: roomInfo.owner_uuid,
            whiteboardRoomToken: createWhiteboardRoomToken(whiteboardRoomUUID),
            whiteboardRoomUUID: whiteboardRoomUUID,
            rtcUID: Number(rtcUID),
            rtcToken: await getRTCToken(roomUUID, Number(rtcUID)),
            rtcShareScreen: {
                uid: AGORA_SHARE_SCREEN_UID,
                token: await getRTCToken(roomUUID, AGORA_SHARE_SCREEN_UID),
            },
            rtmToken: await getRTMToken(userUUID),
            region: roomInfo.region,
            showGuide: roomInfo.owner_uuid === userUUID && (await showGuide(userUUID, roomUUID)),
        },
    };
};
