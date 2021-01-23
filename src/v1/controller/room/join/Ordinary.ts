import cryptoRandomString from "crypto-random-string";
import { Status } from "../../../../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomStatus } from "../Constants";
import { JoinResponse } from "./Type";
import { getRTCToken, getRTMToken } from "../../../utils/AgoraToken";
import { ErrorCode } from "../../../../ErrorCode";
import { Response } from "../../../types/Server";
import { RoomDAO, RoomUserDAO } from "../../../dao";

export const joinOrdinary = async (roomUUID: string, userUUID: string): Response<JoinResponse> => {
    const roomInfo = await RoomDAO().findOne(
        ["room_status", "whiteboard_room_uuid", "periodic_uuid", "room_type", "owner_uuid"],
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

    const { whiteboard_room_uuid: whiteboardRoomUUID } = roomInfo;
    let rtcUID: string;

    if (roomInfo.owner_uuid === userUUID) {
        const roomUserInfo = await RoomUserDAO().findOne(["rtc_uid"], {
            room_uuid: roomUUID,
            user_uuid: userUUID,
        });

        if (roomUserInfo === undefined) {
            throw new Error("When getting the rtcUID of the owner, the result does not exist");
        }

        rtcUID = roomUserInfo.rtc_uid;
    } else {
        rtcUID = cryptoRandomString({ length: 6, type: "numeric" });

        await RoomUserDAO().insert(
            {
                room_uuid: roomUUID,
                user_uuid: userUUID,
                rtc_uid: rtcUID,
            },
            {
                is_delete: false,
            },
        );
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
            rtmToken: await getRTMToken(userUUID),
        },
    };
};
