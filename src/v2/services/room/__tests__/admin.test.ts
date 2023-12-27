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

    const makeResult = (room: typeof ordinary[0]) =>
        pick(room, ["roomUUID", "periodicUUID", "ownerUUID", "roomStatus"]);

    ava.deepEqual(roomsInfo, {
        [ordinary[0].roomUUID]: makeResult(ordinary[0]), // idle
        [ordinary_invite]: makeResult(ordinary[1]), // started
        [periodic_invite]: makeResult(periodic[2]), // paused
    });
    // missing and stopped are not returned

    await releaseRunner();
});
