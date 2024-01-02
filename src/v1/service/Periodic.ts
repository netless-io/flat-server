import { RoomPeriodicModel } from "../../model/room/RoomPeriodic";
import { RoomDAO, RoomPeriodicDAO, RoomPeriodicUserDAO, RoomUserDAO } from "../../dao";
import { RoomStatus, RoomType } from "../../model/room/Constants";
import { MoreThan } from "typeorm";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { whiteboardCreateRoom } from "../utils/request/whiteboard/WhiteboardRequest";
import cryptoRandomString from "crypto-random-string";
import { Region } from "../../constants/Project";

export type NextPeriodicRoomInfo = Pick<
    RoomPeriodicModel,
    "begin_time" | "end_time" | "fake_room_uuid"
>;

export const getNextPeriodicRoomInfo = async (
    periodicUUID: string,
    beginTime: Date,
): Promise<NextPeriodicRoomInfo | undefined> => {
    return await RoomPeriodicDAO().findOne(
        ["begin_time", "end_time", "fake_room_uuid"],
        {
            periodic_uuid: periodicUUID,
            room_status: RoomStatus.Idle,
            begin_time: MoreThan(beginTime),
        },
        ["begin_time", "ASC"],
    );
};

export const updateNextPeriodicRoomInfo = async ({
    transaction,
    periodic_uuid,
    user_uuid,
    title,
    begin_time,
    end_time,
    fake_room_uuid,
    room_type,
    region,
}: {
    transaction: EntityManager;
    periodic_uuid: string;
    user_uuid: string;
    title: string;
    begin_time: RoomPeriodicModel["begin_time"];
    end_time: RoomPeriodicModel["end_time"];
    fake_room_uuid: RoomPeriodicModel["fake_room_uuid"];
    room_type: RoomType;
    region: Region;
}): Promise<Promise<unknown>[]> => {
    const commands: Promise<unknown>[] = [];

    commands.push(
        RoomDAO(transaction).insert({
            periodic_uuid,
            owner_uuid: user_uuid,
            title,
            room_type,
            room_status: RoomStatus.Idle,
            room_uuid: fake_room_uuid,
            whiteboard_room_uuid: await whiteboardCreateRoom(region),
            begin_time,
            end_time,
            region,
        }),
    );

    const periodicRoomAllUsers = await RoomPeriodicUserDAO().find(["user_uuid"], {
        periodic_uuid,
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
