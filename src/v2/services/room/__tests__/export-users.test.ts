import test from "ava";
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
    const users = [];
    for (let i = 0; i < roomUserCount; i++) {
        const user = await createUser.quick();
        const userPhone = await createUserPhone.quick({
            userName: user.userName,
            userUUID: user.userUUID,
        });
        users.push({ ...user, phoneNumber: userPhone.phoneNumber });
    }

    const owner = users[0];
    const room = await createRoom.quick({ ownerUUID: owner.userUUID });

    for (const u of users) {
        await createRoomJoin.quick({
            roomUUID: room.roomUUID,
            userUUID: u.userUUID,
        });
    }

    const roomExportUsersSVC = new RoomExportUsersService(ids(), t, owner.userUUID);
    const roomExportUsersInfo = await roomExportUsersSVC.roomAndUsersIncludePhone(room.roomUUID);

    ava.is(room.title, roomExportUsersInfo.roomTitle);
    ava.is(room.beginTime.valueOf(), roomExportUsersInfo.roomStartDate);
    ava.is(room.endTime.valueOf(), roomExportUsersInfo.roomEndDate);
    ava.is(owner.userName, roomExportUsersInfo.ownerName);
    ava.is(roomUserCount, roomExportUsersInfo.users.length);

    await releaseRunner();
});
