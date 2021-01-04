import { createQueryBuilder, getRepository } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";
import { Status } from "../../../../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { Result } from "./Type";
import { getRTCToken, getRTMToken } from "../../../utils/AgoraToken";

export const joinOrdinary = async (roomUUID: string, userUUID: string): Promise<Result> => {
    const roomInfo = await getRepository(RoomModel).findOne({
        select: ["room_status", "whiteboard_room_uuid", "periodic_uuid"],
        where: {
            room_uuid: roomUUID,
            is_delete: false,
        },
    });

    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            message: "Room not found",
        };
    }

    if (roomInfo.room_status === RoomStatus.Stopped) {
        return {
            status: Status.Failed,
            message: "Room has been ended",
        };
    }

    const { whiteboard_room_uuid: whiteboardRoomUUID } = roomInfo;
    const rtcUID = cryptoRandomString({ length: 10, type: "numeric" });

    await createQueryBuilder()
        .insert()
        .into(RoomUserModel)
        .orIgnore()
        .values({
            room_uuid: roomUUID,
            user_uuid: userUUID,
            rtc_uid: cryptoRandomString({ length: 10, type: "numeric" }),
        })
        .execute();

    return {
        status: Status.Success,
        data: {
            roomUUID: roomUUID,
            whiteboardRoomToken: createWhiteboardRoomToken(whiteboardRoomUUID),
            whiteboardRoomUUID: whiteboardRoomUUID,
            rtcUID: Number(rtcUID),
            rtcToken: await getRTCToken(roomUUID, Number(rtcUID)),
            rtmToken: await getRTMToken(userUUID),
        },
    };
};
