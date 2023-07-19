import test from "ava";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { createRoom, createRoomUser } from "../../info/__tests__/helpers/createUsersRequest";
import { createCancel } from "./helpers/createCancelOrdinary";
import { createJoinRoom } from "./helpers/createJoinRoom";
import { RoomStatus } from "../../../../../model/room/Constants";

const namespace = "[api][api-v1][api-v1-room][api-v1-room-join]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - join after user cancel`, async ava => {
    const [roomUUID] = [v4()];
    const [ownerUUID, anotherUserUUID] = await createRoomUser(roomUUID, 2);
    await createRoom(ownerUUID, roomUUID, RoomStatus.Started);

    const joinRoom = createJoinRoom(roomUUID, anotherUserUUID);
    const result = await joinRoom.execute();
    const f: number = (result as any).data.rtcUID;

    await createCancel(roomUUID, anotherUserUUID).execute();

    const joinRoom1 = createJoinRoom(roomUUID, anotherUserUUID);
    const join1Result = await joinRoom1.execute();
    const f1: number = (join1Result as any).data.rtcUID;

    ava.is(f > 0 && f1 > 0, true);
    ava.is(f == f1, true);
});
