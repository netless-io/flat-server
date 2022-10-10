import test from "ava";
import { v4 } from "uuid";
import { testService } from "../../../__tests__/helpers/db";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { RoomExportUsersService } from "../export-users";
import { RoomExportUserItem } from "../export-users.type";
// import { RoomExportUserItem } from "../export-users.type";

const namespace = "services.room.export-users";

initializeDataSource(test, namespace);

test(`${namespace} - roomAndUsersIncludePhone`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserPhone, createRoom, createRoomJoin } = testService(t);

    const mockUserCount = 3;
    const mockUsers = await Promise.all(
        Array.from({ length: mockUserCount }, async () => {
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
    const user1 = mockUsers[1];
    const user2 = mockUsers[2];

    const room = await createRoom.quick({ ownerUUID: owner.userUUID });

    await createRoomJoin.quick({
        roomUUID: room.roomUUID,
        userUUID: owner.userUUID,
    });

    await createRoomJoin.quick({
        roomUUID: room.roomUUID,
        userUUID: user1.userUUID,
    });

    await createRoomJoin.quick({
        roomUUID: room.roomUUID,
        userUUID: user2.userUUID,
    });

    const roomExportUsersSVC = new RoomExportUsersService(ids(), t, owner.userUUID);
    const roomExportUsersInfo = await roomExportUsersSVC.roomAndUsersIncludePhone(room.roomUUID);
    const { roomTitle, roomStartDate, roomEndDate, ownerName, users } = roomExportUsersInfo;

    ava.is(room.title, roomTitle);
    ava.is(room.beginTime.valueOf(), roomStartDate);
    ava.is(room.endTime.valueOf(), roomEndDate);
    ava.is(owner.userName, ownerName);
    ava.is(mockUserCount, users.length);

    const assertUserInfo = (userInfo: typeof owner, exportUserInfo: RoomExportUserItem) => {
        const assertPhoneNumber = RoomExportUsersService.phoneSMSEnabled
            ? userInfo.phoneNumber
            : undefined;
        ava.is(exportUserInfo.userName, userInfo.userName);
        ava.is(exportUserInfo.userPhone, assertPhoneNumber);
    };
    assertUserInfo(owner, users[0]);
    assertUserInfo(user1, users[1]);
    assertUserInfo(user2, users[2]);

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
