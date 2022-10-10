import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { roomRouters } from "../../routes";
import { roomExportUsers } from "../";
import { testService } from "../../../../__tests__/helpers/db";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { RoomExportUsersService } from "../../../../services/room/export-users";
import {
    RoomExportUserItem,
    RoomExportUsersReturn,
} from "../../../../services/room/export-users.type";

const namespace = "v2.controllers.room.export.users";

initializeDataSource(test, namespace);

test(`${namespace} - export users`, async ava => {
    const { t, releaseRunner, commitTransaction } = await useTransaction();
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

    await commitTransaction();
    await releaseRunner();

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
    const { roomTitle, roomStartDate, roomEndDate, ownerName, users } =
        response.data as RoomExportUsersReturn;

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
});
