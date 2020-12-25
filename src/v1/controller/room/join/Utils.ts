import { getRepository } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";

export const insertUserToRoomUserDB = async (roomUUID: string, userUUID: string): Promise<void> => {
    // insert current user uuid to room_user table when room_user table not current user uuid
    await getRepository(RoomUserModel)
        .createQueryBuilder()
        .insert()
        .orIgnore()
        .values({
            room_uuid: roomUUID,
            user_uuid: userUUID,
            user_int_uuid: cryptoRandomString({ length: 10, type: "numeric" }),
        })
        .execute();
};
