import test from "ava";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { createRoom, createRoomUser, createUsersRequest, getUserGradeRequest, setUserGradeRequest } from "./helpers/createUsersRequest";
import { Status } from "../../../../../constants/Project";

const namespace = "[api][api-v1][api-v1-room][api-v1-room-info][api-v1-room-info-user]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
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

test(`${namespace} - test grade info`, async ava => {
    const [roomUUID] = [v4()];

    const [ownerUUID] = await createRoomUser(roomUUID, 4);

    await createRoom(ownerUUID, roomUUID);

    const setGradeRequest = setUserGradeRequest(
        {
            roomUUID,
            userUUID: ownerUUID,
            grade: 3,
        }
    );

    const result = await setGradeRequest.execute();

    ava.is(result.status, Status.Success);

    const getGradeRequest = getUserGradeRequest(
        {
            roomUUID,
            userUUID: ownerUUID,
        }
    );

    const result1 = await getGradeRequest.execute();

    ava.is(result1.status, Status.Success);

    const data = (result1 as any).data;

    ava.is(data.grade, 3);
});

