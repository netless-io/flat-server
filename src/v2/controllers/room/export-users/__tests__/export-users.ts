import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { roomRouters } from "../../routes";
import { roomExportUsers } from "../";
import { testService } from "../../../../__tests__/helpers/db";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";

const namespace = "v2.controllers.room.export.users";

initializeDataSource(test, namespace);

test(`${namespace} - export users`, async ava => {
    const { t, releaseRunner, commitTransaction } = await useTransaction();
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

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(roomRouters, roomExportUsers);
    const resp = await helperAPI.injectAuth(owner.userUUID, {
        method: "POST",
        url: "/v2/room/export-users",
        payload: {
            roomUUID: room.roomUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    const response = resp.json();
    ava.is(room.title, response.data.roomTitle);
    ava.is(room.beginTime.valueOf(), response.data.roomStartDate);
    ava.is(room.endTime.valueOf(), response.data.roomEndDate);
    ava.is(owner.userName, response.data.ownerName);
    ava.is(roomUserCount, response.data.users.length);

    await releaseRunner();
});
