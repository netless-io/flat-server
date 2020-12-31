import { createQueryBuilder, getRepository } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";
import { Status } from "../../../../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { Result } from "./Type";

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

    await createQueryBuilder()
        .insert()
        .into(RoomUserModel)
        .orIgnore()
        .values({
            room_uuid: roomUUID,
            user_uuid: userUUID,
            user_int_uuid: cryptoRandomString({ length: 10, type: "numeric" }),
        })
        .execute();

    return {
        status: Status.Success,
        data: {
            roomUUID: roomUUID,
            whiteboardRoomToken: createWhiteboardRoomToken(roomInfo.whiteboard_room_uuid),
            whiteboardRoomUUID: roomInfo.whiteboard_room_uuid,
        },
    };
};
