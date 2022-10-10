import test from "ava";
import { v4 } from "uuid";
import { testService } from "../../../__tests__/helpers/db";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { RoomExportUsersService } from "../export-users";

const namespace = "services.room.export-users";

initializeDataSource(test, namespace);

test(`${namespace} - roomAndUsersIncludePhone`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserPhone, createRoom, createRoomJoin } = testService(t);

    const roomUserCount = 10;
    const mockUsers = await Promise.all(
        Array.from({ length: roomUserCount }, async () => {
            const user = await createUser.quick();
            const { phoneNumber } = await createUserPhone.quick({
                userName: user.userName,
                userUUID: user.userUUID,
            });
            return {
                ...user,
                phoneNumber,
            };
        }),
    );

    const owner = mockUsers[0];
    const room = await createRoom.quick({ ownerUUID: owner.userUUID });

    await Promise.all(
        mockUsers.map(u => {
            return createRoomJoin.quick({
                roomUUID: room.roomUUID,
                userUUID: u.userUUID,
            });
        }),
    );

    const roomExportUsersSVC = new RoomExportUsersService(ids(), t, owner.userUUID);
    const roomExportUsersInfo = await roomExportUsersSVC.roomAndUsersIncludePhone(room.roomUUID);
    const { roomTitle, roomStartDate, roomEndDate, ownerName, users } = roomExportUsersInfo;
    ava.is(room.title, roomTitle);
    ava.is(room.beginTime.valueOf(), roomStartDate);
    ava.is(room.endTime.valueOf(), roomEndDate);
    ava.is(owner.userName, ownerName);
    ava.is(roomUserCount, users.length);

    const usersMap: Record<string, typeof owner> = {};
    mockUsers.forEach(u => {
        usersMap[u.userName] = u;
    });

    users.forEach(u => {
        const { userName, userPhone } = u;
        const assertPhoneNumber = RoomExportUsersService.phoneSMSEnabled
            ? usersMap[userName].phoneNumber
            : undefined;
        ava.is(userName, usersMap[userName].userName);
        ava.is(userPhone, assertPhoneNumber);
    });

    await releaseRunner();
});

test(`${namespace} - assert room owner`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createRoom } = testService(t);

    const [userUUID] = [v4(), v4()];

    const room = await createRoom.quick({ ownerUUID: userUUID });

    {
        const roomExportUsersSVC = new RoomExportUsersService(ids(), t, userUUID);
        await ava.notThrowsAsync(roomExportUsersSVC.assertRoomOwner(room.roomUUID));
    }

    {
        const roomExportUsersSVC = new RoomExportUsersService(ids(), t, v4());
        await ava.throwsAsync(roomExportUsersSVC.assertRoomOwner(room.roomUUID));
    }

    releaseRunner;
});
