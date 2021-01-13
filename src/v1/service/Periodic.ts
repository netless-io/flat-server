import { RoomPeriodicModel } from "../model/room/RoomPeriodic";
import { RoomDAO, RoomPeriodicDAO, RoomPeriodicUserDAO, RoomUserDAO } from "../dao";
import { RoomStatus, RoomType } from "../controller/room/Constants";
import { MoreThanOrEqual, Not } from "typeorm";
import { addMinutes } from "date-fns/fp";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { whiteboardCreateRoom } from "../utils/Whiteboard";
import cryptoRandomString from "crypto-random-string";
import { Where } from "../dao/Type";

export const getNextRoomPeriodicInfo = async (
    periodicUUID: string,
    excludeRoomUUID?: string,
): Promise<Pick<RoomPeriodicModel, "begin_time" | "end_time" | "fake_room_uuid"> | undefined> => {
    const where: Where<RoomPeriodicModel> = {
        periodic_uuid: periodicUUID,
        room_status: RoomStatus.Idle,
        end_time: MoreThanOrEqual(addMinutes(1, new Date())),
    };

    if (excludeRoomUUID) {
        where.fake_room_uuid = Not(excludeRoomUUID);
    }

    return await RoomPeriodicDAO().findOne(["begin_time", "end_time", "fake_room_uuid"], where, [
        "end_time",
        "ASC",
    ]);
};

export const updateNextRoomPeriodicInfo = async ({
    transaction,
    periodicUUID,
    userUUID,
    title,
    begin_time,
    end_time,
    fake_room_uuid,
    room_type,
}: {
    transaction: EntityManager;
    periodicUUID: string;
    userUUID: string;
    title: string;
    begin_time: RoomPeriodicModel["begin_time"];
    end_time: RoomPeriodicModel["end_time"];
    fake_room_uuid: RoomPeriodicModel["fake_room_uuid"];
    room_type: RoomType;
}): Promise<Promise<unknown>[]> => {
    const commands: Promise<unknown>[] = [];

    commands.push(
        RoomDAO(transaction).insert({
            periodic_uuid: periodicUUID,
            owner_uuid: userUUID,
            title,
            room_type,
            room_status: RoomStatus.Idle,
            room_uuid: fake_room_uuid,
            whiteboard_room_uuid: await whiteboardCreateRoom(title),
            begin_time,
            end_time,
        }),
    );

    const periodicRoomAllUsers = await RoomPeriodicUserDAO().find(["user_uuid"], {
        periodic_uuid: periodicUUID,
    });

    const transformRoomUser = periodicRoomAllUsers.map(({ user_uuid }) => {
        return {
            room_uuid: fake_room_uuid,
            user_uuid: user_uuid,
            rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
        };
    });

    /**
     * TODO: when the number exceeds 500, there will be performance problems
     * Combining RoomUser and RoomPeriodicUsers should solve this potential problem
     */
    commands.push(RoomUserDAO(transaction).insert(transformRoomUser));

    return commands;
};
