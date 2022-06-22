import test from "ava";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { createCancelOrdinary } from "./helpers/createCancelOrdinary";
import { ErrorCode } from "../../../../../ErrorCode";
import { RoomDAO, RoomUserDAO } from "../../../../../dao";
import { Region } from "../../../../../constants/Project";
import { addMinutes } from "date-fns/fp";
import { RoomStatus, RoomType } from "../../../../../model/room/Constants";
import cryptoRandomString from "crypto-random-string";
import { Logger } from "../../../../../logger";
import { LoggerPluginTest } from "./helpers/logger";
import sinon from "sinon";
import { ax } from "../../../../utils/Axios";

const namespace = "[api][api-v1][api-room][api-room-cancel][api-room-cancel-ordinary]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - room not found`, async ava => {
    ava.plan(1);
    const [userUUID, roomUUID] = [v4(), v4()];

    const cancelOrdinary = createCancelOrdinary(userUUID, roomUUID);

    try {
        await cancelOrdinary.execute();
    } catch (error) {
        ava.is(cancelOrdinary.errorHandler(error).code, ErrorCode.RoomNotFound);
    }
});

test(`${namespace} - ban room failed`, async ava => {
    const [userUUID, roomUUID] = [v4(), v4()];

    await RoomDAO().insert({
        room_uuid: roomUUID,
        owner_uuid: userUUID,
        title: "test",
        region: Region.US_SV,
        whiteboard_room_uuid: v4().replace("-", ""),
        begin_time: new Date(),
        end_time: addMinutes(30)(Date.now()),
        room_status: RoomStatus.Idle,
        periodic_uuid: "",
        room_type: RoomType.BigClass,
    });

    const flag = {
        trigger: false,
    };
    const logger = new Logger("test", {}, [new LoggerPluginTest(flag)]);
    const cancelOrdinary = createCancelOrdinary(userUUID, roomUUID, logger);

    const stubAxios = sinon.stub(ax, "patch").rejects();

    await cancelOrdinary.execute();

    ava.true(flag.trigger);

    stubAxios.restore();
});

test(`${namespace} - room is periodic sub room`, async ava => {
    ava.plan(1);

    const [userUUID, roomUUID] = [v4(), v4()];

    await RoomDAO().insert({
        room_uuid: roomUUID,
        owner_uuid: userUUID,
        title: "test",
        region: Region.US_SV,
        whiteboard_room_uuid: v4().replace("-", ""),
        begin_time: new Date(),
        end_time: addMinutes(30)(Date.now()),
        room_status: RoomStatus.Idle,
        periodic_uuid: v4(),
        room_type: RoomType.BigClass,
    });

    const cancelOrdinary = createCancelOrdinary(userUUID, roomUUID);

    try {
        await cancelOrdinary.execute();
    } catch (error) {
        ava.is(cancelOrdinary.errorHandler(error).code, ErrorCode.NotPermission);
    }
});

test(`${namespace} - user is room owner and room is running`, async ava => {
    ava.plan(1);

    const [userUUID, roomUUID] = [v4(), v4()];

    await RoomDAO().insert({
        room_uuid: roomUUID,
        owner_uuid: userUUID,
        title: "test",
        region: Region.US_SV,
        whiteboard_room_uuid: v4().replace("-", ""),
        begin_time: new Date(),
        end_time: addMinutes(30)(Date.now()),
        room_status: RoomStatus.Started,
        periodic_uuid: "",
        room_type: RoomType.OneToOne,
    });

    const cancelOrdinary = createCancelOrdinary(userUUID, roomUUID);

    try {
        await cancelOrdinary.execute();
    } catch (error) {
        ava.is(cancelOrdinary.errorHandler(error).code, ErrorCode.RoomIsRunning);
    }
});

test(`${namespace} - student cancel room`, async ava => {
    const [ownerUUID, userUUID, roomUUID] = [v4(), v4(), v4()];

    await RoomDAO().insert({
        room_uuid: roomUUID,
        owner_uuid: ownerUUID,
        title: "test",
        region: Region.US_SV,
        whiteboard_room_uuid: v4().replace("-", ""),
        begin_time: new Date(),
        end_time: addMinutes(30)(Date.now()),
        room_status: RoomStatus.Paused,
        periodic_uuid: "",
        room_type: RoomType.OneToOne,
    });

    await RoomUserDAO().insert([
        {
            room_uuid: roomUUID,
            user_uuid: userUUID,
            rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
        },
        {
            room_uuid: roomUUID,
            user_uuid: ownerUUID,
            rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
        },
    ]);

    const cancelOrdinary = createCancelOrdinary(userUUID, roomUUID);

    await cancelOrdinary.execute();

    {
        const result = await RoomUserDAO().find(["id", "is_delete", "room_uuid", "user_uuid"], {
            user_uuid: userUUID,
        });

        ava.is(result.length, 0, "remove self failed in room user table");
    }

    {
        const result = await RoomDAO().find(["room_uuid", "owner_uuid"], {
            owner_uuid: ownerUUID,
        });

        ava.is(result.length, 1, "students should not have the right to delete room");

        ava.is(result[0].room_uuid, roomUUID);
        ava.is(result[0].owner_uuid, ownerUUID);
    }
});

test(`${namespace} - owner cancel room`, async ava => {
    const [userUUID, roomUUID] = [v4(), v4()];

    const cancelOrdinary = createCancelOrdinary(userUUID, roomUUID);

    await RoomDAO().insert({
        room_uuid: roomUUID,
        owner_uuid: userUUID,
        title: "test",
        region: Region.US_SV,
        whiteboard_room_uuid: v4().replace("-", ""),
        begin_time: new Date(),
        end_time: addMinutes(30)(Date.now()),
        room_status: RoomStatus.Idle,
        periodic_uuid: "",
        room_type: RoomType.OneToOne,
    });

    await RoomUserDAO().insert({
        room_uuid: roomUUID,
        user_uuid: userUUID,
        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
    });

    await cancelOrdinary.execute();

    const result = await RoomDAO().findOne(["id"], {
        room_uuid: roomUUID,
    });

    ava.is(result, undefined);
});
