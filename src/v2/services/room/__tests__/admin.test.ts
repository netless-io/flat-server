import RedisService from "../../../../thirdPartyService/RedisService";

import test from "ava";
import { v4 } from "uuid";
import { RoomStatus } from "../../../../model/room/Constants";
import { RedisKey } from "../../../../utils/Redis";
import { testService } from "../../../__tests__/helpers/db";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { RoomAdminService } from "../admin";
import { pick } from "lodash";
import { roomDAO } from "../../../dao";

const namespace = "services.room.admin";
initializeDataSource(test, namespace);

test(`${namespace} - roomsInfo`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createRoom } = testService(t);

    const ordinary = [
        await createRoom.quick({ roomStatus: RoomStatus.Idle }),
        await createRoom.quick({ roomStatus: RoomStatus.Started }),
        await createRoom.quick({ roomStatus: RoomStatus.Paused }),
        await createRoom.quick({ roomStatus: RoomStatus.Stopped }),
    ];

    const periodic = [
        await createRoom.quick({ periodicUUID: v4(), roomStatus: RoomStatus.Idle }),
        await createRoom.quick({ periodicUUID: v4(), roomStatus: RoomStatus.Started }),
        await createRoom.quick({ periodicUUID: v4(), roomStatus: RoomStatus.Paused }),
        await createRoom.quick({ periodicUUID: v4(), roomStatus: RoomStatus.Stopped }),
    ];

    await commitTransaction();

    const UUIDs: string[] = [];
    UUIDs.push(ordinary[0].roomUUID); // normal long uuid
    const ordinary_invite = "1111111111";
    RedisService.set(RedisKey.roomInviteCode(ordinary_invite), ordinary[1].roomUUID); // started
    UUIDs.push(ordinary_invite); // invite code in redis

    const periodic_invite = "2222222222";
    UUIDs.push(periodic[0].periodicUUID); // normal long uuid
    RedisService.set(RedisKey.roomInviteCode(periodic_invite), periodic[2].roomUUID); // paused
    UUIDs.push(periodic_invite); // invite code in redis

    UUIDs.push(ordinary[3].roomUUID); // stopped rooms
    UUIDs.push(periodic[3].roomUUID);
    UUIDs.push(v4()); // missing uuid
    UUIDs.push("3333333333"); // missing invite code

    const service = new RoomAdminService(ids(), t);
    const roomsInfo = await service.roomsInfo(UUIDs);

    const makeResult = (room: typeof ordinary[0]) => {
        const data = pick(room, ["roomUUID", "periodicUUID", "ownerUUID", "roomStatus", "beginTime"]);
        data["beginTime"] = data["beginTime"].getTime() as any;
        return data;
    };

    ava.deepEqual(roomsInfo, {
        [ordinary[0].roomUUID]: makeResult(ordinary[0]), // idle
        [periodic[0].periodicUUID]: makeResult(periodic[0]), // idle
        [ordinary_invite]: makeResult(ordinary[1]), // started
        [periodic_invite]: makeResult(periodic[2]), // paused
    });
    // missing and stopped are not returned

    await releaseRunner();
});

test(`${namespace} - online`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const roomUUID = v4();
    const userUUID = v4();
    const service = new RoomAdminService(ids(), t);

    ava.is(await RedisService.zcard(RedisKey.online(roomUUID)), 0);

    await service.online(roomUUID, userUUID);
    ava.is(await RedisService.zcard(RedisKey.online(roomUUID)), 1);

    // Not increase zcard when 'online' again for the same user
    await service.online(roomUUID, userUUID);
    ava.is(await RedisService.zcard(RedisKey.online(roomUUID)), 1);

    await releaseRunner();
});

test(`${namespace} - banRooms`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createUser, createRoom } = testService(t);

    const user = await createUser.quick();
    const ordinary = await createRoom.quick({
        ownerUUID: user.userUUID,
        roomStatus: RoomStatus.Started,
    });

    await commitTransaction();

    const service = new RoomAdminService(ids(), t);
    await service.banRooms([ordinary.roomUUID, v4()]); // unknown room should not throw error

    const room = await roomDAO.findOne(t, ["room_status"], { room_uuid: ordinary.roomUUID });
    ava.is(room?.room_status, RoomStatus.Stopped);

    await releaseRunner();
});
