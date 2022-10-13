import test from "ava";
import { RoomExportUsersReturn } from "../../../../services/room/export-users.type";
import { roomExportUsers } from "../";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { testService } from "../../../../__tests__/helpers/db";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { successJSON } from "../../../internal/utils/response-json";
import { roomRouters } from "../../routes";
import { stub } from "sinon";
import { RoomExportUsersService } from "../../../../services/room/export-users";

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
                joinRoomDate: 0,
            };
        }),
    );

    const owner = mockUsers[0];
    const user1 = mockUsers[1];
    const user2 = mockUsers[2];

    const room = await createRoom.quick({ ownerUUID: owner.userUUID });

    for (const u of mockUsers) {
        const result = await createRoomJoin.quick({
            roomUUID: room.roomUUID,
            userUUID: u.userUUID,
        });
        u.joinRoomDate = result.createdAt;
    }

    await commitTransaction();
    await releaseRunner();

    const helperAPI = new HelperAPI();
    await helperAPI.import(roomRouters, roomExportUsers);

    {
        const phoneSMSEnabled = stub(RoomExportUsersService, "phoneSMSEnabled").value(true);

        const resp = await helperAPI.injectAuth(owner.userUUID, {
            method: "POST",
            url: "/v2/room/export-users",
            payload: {
                roomUUID: room.roomUUID,
            },
        });

        ava.is(resp.statusCode, 200);
        ava.deepEqual(
            resp.json(),
            successJSON<RoomExportUsersReturn>({
                roomTitle: room.title,
                roomStartDate: room.beginTime.valueOf(),
                roomEndDate: room.endTime.valueOf(),
                ownerName: owner.userName,
                users: [
                    {
                        userName: owner.userName,
                        userPhone: owner.phoneNumber,
                        joinRoomDate: owner.joinRoomDate,
                    },
                    {
                        userName: user1.userName,
                        userPhone: user1.phoneNumber,
                        joinRoomDate: user1.joinRoomDate,
                    },
                    {
                        userName: user2.userName,
                        userPhone: user2.phoneNumber,
                        joinRoomDate: user2.joinRoomDate,
                    },
                ],
            }),
        );
        phoneSMSEnabled.restore();
    }

    {
        const phoneSMSEnabled = stub(RoomExportUsersService, "phoneSMSEnabled").value(false);

        const resp = await helperAPI.injectAuth(owner.userUUID, {
            method: "POST",
            url: "/v2/room/export-users",
            payload: {
                roomUUID: room.roomUUID,
            },
        });

        ava.is(resp.statusCode, 200);
        ava.deepEqual(
            resp.json(),
            successJSON<RoomExportUsersReturn>({
                roomTitle: room.title,
                roomStartDate: room.beginTime.valueOf(),
                roomEndDate: room.endTime.valueOf(),
                ownerName: owner.userName,
                users: [
                    {
                        userName: owner.userName,
                        joinRoomDate: owner.joinRoomDate,
                    },
                    {
                        userName: user1.userName,
                        joinRoomDate: user1.joinRoomDate,
                    },
                    {
                        userName: user2.userName,
                        joinRoomDate: user2.joinRoomDate,
                    },
                ],
            }),
        );
        phoneSMSEnabled.restore();
    }
});
