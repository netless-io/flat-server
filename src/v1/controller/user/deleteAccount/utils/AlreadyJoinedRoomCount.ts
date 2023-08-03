import { EntityManager } from "typeorm";
import { RoomUserModel } from "../../../../../model/room/RoomUser";
import { RoomModel } from "../../../../../model/room/Room";
import { RoomStatus } from "../../../../../model/room/Constants";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";

export const alreadyJoinedRoomCount = async (
    userUUID: string,
    t?: EntityManager,
): Promise<number> => {
    return await (t || dataSource)
        .createQueryBuilder(RoomUserModel, "ru")
        .innerJoin(RoomModel, "r", "ru.room_uuid = r.room_uuid")
        .andWhere("ru.user_uuid = :userUUID", {
            userUUID: userUUID,
        })
        .andWhere("r.room_status <> :notRoomStatus", {
            notRoomStatus: RoomStatus.Stopped,
        })
        .andWhere("ru.is_delete = false")
        .andWhere("r.is_delete = false")
        .getCount();
};
