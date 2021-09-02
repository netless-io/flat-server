import { Connection } from "typeorm";
import test from "ava";
import { orm } from "../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { RoomUserDAO } from "../../../../dao";
import cryptoRandomString from "crypto-random-string";
import { ServiceRoomUser } from "../RoomUser";

const namespace = "[service][service-room][service-room-user]";

let connection: Connection;
test.before(`${namespace} - connection orm`, async () => {
    connection = await orm();
});

test.after(`${namespace} - close orm`, async () => {
    await connection.close();
});

test(`${namespace} - remove self`, async ava => {
    const [roomUUID, userUUID] = [v4(), v4()];

    await RoomUserDAO().insert({
        room_uuid: roomUUID,
        user_uuid: userUUID,
        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
    });

    const serviceRoomUser = new ServiceRoomUser(roomUUID, userUUID);

    await serviceRoomUser.removeSelf();

    const result = await RoomUserDAO().count({
        user_uuid: userUUID,
    });

    ava.is(result, 0);
});

test(`${namespace} - add self`, async ava => {
    const [roomUUID, userUUID] = [v4(), v4()];

    const serviceRoomUser = new ServiceRoomUser(roomUUID, userUUID);

    await serviceRoomUser.addSelf();

    const result = await RoomUserDAO().find(["room_uuid"], {
        user_uuid: userUUID,
    });

    ava.is(result.length, 1);

    ava.is(result[0].room_uuid, roomUUID);
});
