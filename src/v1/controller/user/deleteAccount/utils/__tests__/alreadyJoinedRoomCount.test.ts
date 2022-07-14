import test from "ava";
import { dataSource } from "../../../../../../thirdPartyService/TypeORMService";
import { RoomStatus, RoomType } from "../../../../../../model/room/Constants";
import { RoomDAO, RoomUserDAO } from "../../../../../../dao";
import { v4 } from "uuid";
import { Region } from "../../../../../../constants/Project";
import { alreadyJoinedRoomCount } from "../AlreadyJoinedRoomCount";

const namespace =
    "[api][api-v1][api-v1-user][api-v1-user-deleteAccount][api-v1-user-deleteAccount-utils][utils]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

const createRoom = async (userUUID: string, roomStatus: RoomStatus): Promise<void> => {
    const roomUUID = v4();

    await Promise.all([
        RoomDAO().insert({
            periodic_uuid: "",
            owner_uuid: userUUID,
            title: v4(),
            room_type: RoomType.OneToOne,
            room_status: roomStatus,
            room_uuid: roomUUID,
            whiteboard_room_uuid: v4(),
            begin_time: new Date(),
            end_time: new Date(),
            region: Region.CN_HZ,
        }),
        RoomUserDAO().insert({
            room_uuid: roomUUID,
            user_uuid: userUUID,
            rtc_uid: "113",
        }),
    ]);
};

test(`${namespace} - should be no stopped rooms`, async ava => {
    const userUUID = v4();

    await Promise.all([
        createRoom(userUUID, RoomStatus.Started),
        createRoom(userUUID, RoomStatus.Idle),
        createRoom(userUUID, RoomStatus.Paused),
        createRoom(userUUID, RoomStatus.Stopped),
    ]);

    const count = await alreadyJoinedRoomCount(userUUID);

    ava.is(count, 3);
});
