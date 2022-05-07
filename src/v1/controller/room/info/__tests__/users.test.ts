import { Connection } from "typeorm";
import test from "ava";
import { orm } from "../../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { createRoom, createRoomUser, createUsersRequest } from "./helpers/createUsersRequest";
import { Status } from "../../../../../constants/Project";

const namespace = "[api][api-v1][api-v1-room][api-v1-room-info][api-v1-room-info-user]";

let connection: Connection;
test.before(`${namespace} - connection orm`, async () => {
    connection = await orm();
});

test.after(`${namespace} - close orm`, async () => {
    await connection.close();
});

test(`${namespace} - show specify user info`, async ava => {
    const [roomUUID] = [v4()];

    const [ownerUUID, ...usersUUID] = await createRoomUser(roomUUID, 5);

    await createRoom(ownerUUID, roomUUID);

    const specifyUsers = usersUUID.splice(-2);

    const userRequest = createUsersRequest(
        {
            roomUUID,
            usersUUID: specifyUsers,
        },
        ownerUUID,
    );

    const result = await userRequest.execute();

    ava.is(result.status, Status.Success);

    const data = (result as any).data;

    ava.is(Object.keys(data).length, 2);

    ava.not(data[specifyUsers[0]], undefined);
});

test(`${namespace} - show all user info`, async ava => {
    const [roomUUID] = [v4()];

    const [ownerUUID] = await createRoomUser(roomUUID, 4);

    await createRoom(ownerUUID, roomUUID);

    const userRequest = createUsersRequest(
        {
            roomUUID,
        },
        ownerUUID,
    );

    const result = await userRequest.execute();

    ava.is(result.status, Status.Success);

    const data = (result as any).data;

    ava.is(Object.keys(data).length, 4);
});
