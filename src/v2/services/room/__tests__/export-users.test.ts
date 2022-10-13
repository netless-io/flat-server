import test from "ava";
import { Status } from "../../../../constants/Project";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { v4 } from "uuid";
import { testService } from "../../../__tests__/helpers/db";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { RoomExportUsersService } from "../export-users";
import { stub } from "sinon";

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

    {
        const phoneSMSEnabled = stub(RoomExportUsersService, "phoneSMSEnabled").value(true);

        const roomExportUsersSVC = new RoomExportUsersService(ids(), t, owner.userUUID);

        const roomExportUsersInfo = await roomExportUsersSVC.roomAndUsersIncludePhone(
            room.roomUUID,
        );

        ava.deepEqual(roomExportUsersInfo, {
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
        });
        phoneSMSEnabled.restore();
    }

    {
        const phoneSMSEnabled = stub(RoomExportUsersService, "phoneSMSEnabled").value(false);

        const roomExportUsersSVC = new RoomExportUsersService(ids(), t, owner.userUUID);

        const roomExportUsersInfo = await roomExportUsersSVC.roomAndUsersIncludePhone(
            room.roomUUID,
        );

        ava.deepEqual(roomExportUsersInfo, {
            roomTitle: room.title,
            roomStartDate: room.beginTime.valueOf(),
            roomEndDate: room.endTime.valueOf(),
            ownerName: owner.userName,
            users: [
                {
                    userName: owner.userName,
                    userPhone: undefined,
                    joinRoomDate: owner.joinRoomDate,
                },
                {
                    userName: user1.userName,
                    userPhone: undefined,
                    joinRoomDate: user1.joinRoomDate,
                },
                {
                    userName: user2.userName,
                    userPhone: undefined,
                    joinRoomDate: user2.joinRoomDate,
                },
            ],
        });
        phoneSMSEnabled.restore();
    }

    await releaseRunner();
});

test(`${namespace} - assert room owner`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createRoom } = testService(t);

    const room = await createRoom.quick();

    {
        const roomExportUsersSVC = new RoomExportUsersService(ids(), t, room.ownerUUID);
        await ava.notThrowsAsync(roomExportUsersSVC.assertRoomOwner(room.roomUUID));
    }

    {
        const roomExportUsersSVC = new RoomExportUsersService(ids(), t, v4());
        await ava.throwsAsync(roomExportUsersSVC.assertRoomOwner(room.roomUUID), {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.RoomNotFound}`,
        });
    }

    await releaseRunner();
});
