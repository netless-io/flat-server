import test from "ava";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { ResponseType } from "../index";
import { addDays, addHours, addMinutes, startOfDay, subMinutes } from "date-fns/fp";
import { ListType, RoomStatus, RoomType } from "../../../../../model/room/Constants";
import { Gender, Region, Status } from "../../../../../constants/Project";
import cryptoRandomString from "crypto-random-string";
import { RoomDAO, RoomRecordDAO, RoomUserDAO, UserDAO } from "../../../../../dao";
import { ResponseSuccess } from "../../../../../types/Server";
import { isASC, isDESC } from "./helpers/sort";
import { roomIsIdle } from "../../utils/RoomStatus";
import { createList } from "./helpers/createList";
import { ErrorCode } from "../../../../../ErrorCode";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { generateInviteCode } from "../../utils/GenerateInviteCode";
import { RoomModel } from "../../../../../model/room/Room";

const namespace = "[api][api-v1][api-v1-room][api-v1-room-list]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - list history normal`, async ava => {
    const userUUID = v4();

    const fakeRoomsData = new Array(60).fill(1).map((_v, i) => {
        const beginTime = addHours(i + 1)(Date.now());
        return {
            room_uuid: v4(),
            periodic_uuid: "",
            owner_uuid: userUUID,
            title: `test history - ${i}`,
            room_type: RoomType.OneToOne,
            room_status: RoomStatus.Stopped,
            begin_time: beginTime,
            end_time: addMinutes(30)(beginTime),
            whiteboard_room_uuid: v4().replace("-", ""),
            region: Region.SG,
        };
    });
    const fakeRoomUserData = fakeRoomsData.map(room => ({
        room_uuid: room.room_uuid,
        user_uuid: userUUID,
        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
    }));
    const fakeRoomRecordData = fakeRoomsData
        .map(room => ({
            room_uuid: room.room_uuid,
            begin_time: room.begin_time,
            end_time: room.end_time,
        }))
        .splice(20);
    const fakeUserData = {
        user_uuid: userUUID,
        gender: Gender.Man,
        avatar_url: "",
        user_name: "test_user_0",
        user_password: "",
    };

    await Promise.all([
        RoomDAO().insert(fakeRoomsData),
        RoomUserDAO().insert(fakeRoomUserData),
        UserDAO().insert(fakeUserData),
        RoomRecordDAO().insert(fakeRoomRecordData),
    ]);

    await dataSource.createQueryBuilder().update(RoomModel).set({has_record: true}).where("room_uuid in (:ids)", {ids: fakeRoomRecordData.map(room => room.room_uuid)}).execute()

    const historyList = createList(ListType.History, userUUID);

    const result = (await historyList.execute()) as ResponseSuccess<ResponseType>;

    ava.is(result.status, Status.Success);
    ava.is(result.data.length, 50);

    const hasRecordRooms = result.data
        .filter(room => room.hasRecord)
        .map(room => room.roomUUID)
        .sort();

    ava.is(fakeRoomRecordData.length, hasRecordRooms.length)

    ava.deepEqual(fakeRoomRecordData.map(room => room.room_uuid).sort(), hasRecordRooms);

    ava.true(
        isDESC(result.data.map(room => room.beginTime.valueOf())),
        "history room list is not in desc order according to begin_time",
    );
});

test(`${namespace} - list history duplicate data`, async ava => {
    const userUUID = v4();

    const fakeRoomsData = {
        room_uuid: v4(),
        periodic_uuid: "",
        owner_uuid: userUUID,
        title: "list history duplicate data",
        room_type: RoomType.OneToOne,
        room_status: RoomStatus.Stopped,
        begin_time: new Date(),
        end_time: addMinutes(30)(Date.now()),
        whiteboard_room_uuid: v4().replace("-", ""),
        region: Region.GB_LON,
    };
    const fakeRoomUserData = {
        room_uuid: fakeRoomsData.room_uuid,
        user_uuid: userUUID,
        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
    };
    const fakeRoomRecordData = new Array(2).fill(1).map(() => ({
        room_uuid: fakeRoomsData.room_uuid,
        begin_time: fakeRoomsData.begin_time,
        end_time: fakeRoomsData.end_time,
    }));

    const fakeUserData = {
        user_uuid: userUUID,
        gender: Gender.Woman,
        avatar_url: "",
        user_name: "test_user_1",
        user_password: "",
    };

    await Promise.all([
        RoomDAO().insert(fakeRoomsData),
        RoomUserDAO().insert(fakeRoomUserData),
        UserDAO().insert(fakeUserData),
        RoomRecordDAO().insert(fakeRoomRecordData),
    ]);

    const historyList = createList(ListType.History, userUUID);

    const result = (await historyList.execute()) as ResponseSuccess<ResponseType>;

    ava.is(result.status, Status.Success);
    ava.is(result.data.length, 1);
});

test(`${namespace} - list all normal`, async ava => {
    const userUUID = v4();

    const fakeRoomsData = new Array(30).fill(1).map((_v, i) => {
        const beginTime = addHours(i + 1)(Date.now());
        return {
            room_uuid: v4(),
            periodic_uuid: "",
            owner_uuid: userUUID,
            title: `test all - ${i}`,
            room_type: RoomType.OneToOne,
            room_status:
                i < 10 ? RoomStatus.Started : i < 20 ? RoomStatus.Idle : RoomStatus.Stopped,
            begin_time: beginTime,
            end_time: addMinutes(30)(beginTime),
            whiteboard_room_uuid: v4().replace("-", ""),
            region: Region.US_SV,
        };
    });
    const fakeRoomUserData = fakeRoomsData.map(room => ({
        room_uuid: room.room_uuid,
        user_uuid: userUUID,
        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
    }));
    const fakeUserData = {
        user_uuid: userUUID,
        gender: Gender.Man,
        avatar_url: "",
        user_name: "test_user_2",
        user_password: "",
    };

    await Promise.all([
        RoomDAO().insert(fakeRoomsData),
        RoomUserDAO().insert(fakeRoomUserData),
        UserDAO().insert(fakeUserData),
    ]);

    const allList = createList(ListType.All, userUUID);

    const result = (await allList.execute()) as ResponseSuccess<ResponseType>;

    ava.is(result.status, Status.Success);
    ava.is(result.data.length, 20);
    ava.is(result.data.filter(room => roomIsIdle(room.roomStatus)).length, 10);
    ava.true(
        isASC(result.data.map(room => room.beginTime.valueOf())),
        "history room list is not in asc order according to begin_time",
    );
});

test(`${namespace} - list today normal`, async ava => {
    const userUUID = v4();

    const fakeRoomsData = new Array(30).fill(1).map((_v, i) => {
        const beginTime = (() => {
            if (i < 20) {
                const basicResult = addMinutes((i + 1) * 10)(startOfDay(Date.now()));

                const timezoneOffset = new Date().getTimezoneOffset();
                return timezoneOffset < 0
                    ? addMinutes(Math.abs(timezoneOffset))(basicResult)
                    : subMinutes(Math.abs(timezoneOffset))(basicResult);
            }
            return addDays(i)(Date.now());
        })();

        return {
            room_uuid: v4(),
            periodic_uuid: "",
            owner_uuid: i < 15 ? userUUID : v4(),
            title: `test today - ${i}`,
            room_type: RoomType.SmallClass,
            room_status: RoomStatus.Started,
            begin_time: beginTime,
            end_time: addMinutes(30)(beginTime),
            whiteboard_room_uuid: v4().replace("-", ""),
            region: Region.US_SV,
        };
    });
    const fakeRoomUserData = fakeRoomsData.map(room => ({
        room_uuid: room.room_uuid,
        user_uuid: userUUID,
        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
    }));
    const fakeUserData = {
        user_uuid: userUUID,
        gender: Gender.Man,
        avatar_url: "",
        user_name: "test_user_3",
        user_password: "",
    };

    await Promise.all([
        RoomDAO().insert(fakeRoomsData),
        RoomUserDAO().insert(fakeRoomUserData),
        UserDAO().insert(fakeUserData),
    ]);

    const todayList = createList(ListType.Today, userUUID);

    const result = (await todayList.execute()) as ResponseSuccess<ResponseType>;

    ava.is(result.status, Status.Success);
    ava.is(result.data.length, 15);
    ava.is(
        Array.from(new Set(result.data.map(room => room.ownerUUID)))[0],
        userUUID,
        "today room list has other user",
    );
});

test(`${namespace} - list periodic normal`, async ava => {
    const userUUID = v4();

    const fakeRoomsData = new Array(10).fill(1).map((_v, i) => {
        const beginTime = addHours(i + 1)(Date.now());
        return {
            room_uuid: v4(),
            periodic_uuid: i < 5 ? v4() : "",
            owner_uuid: i < 3 ? userUUID : v4(),
            title: `test history - ${i}`,
            room_type: RoomType.BigClass,
            room_status: RoomStatus.Started,
            begin_time: beginTime,
            end_time: addMinutes(30)(beginTime),
            whiteboard_room_uuid: v4().replace("-", ""),
            region: Region.IN_MUM,
        };
    });
    const fakeRoomUserData = fakeRoomsData.map(room => ({
        room_uuid: room.room_uuid,
        user_uuid: userUUID,
        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
    }));
    const fakeUserData = {
        user_uuid: userUUID,
        gender: Gender.Man,
        avatar_url: "",
        user_name: "test_user_4",
        user_password: "",
    };

    await Promise.all([
        RoomDAO().insert(fakeRoomsData),
        RoomUserDAO().insert(fakeRoomUserData),
        UserDAO().insert(fakeUserData),
    ]);

    const periodicList = createList(ListType.Periodic, userUUID);

    const result = (await periodicList.execute()) as ResponseSuccess<ResponseType>;

    ava.is(result.status, Status.Success);
    ava.is(result.data.length, 3);
    ava.deepEqual(
        result.data
            .filter(room => !!room.periodicUUID)
            .map(room => room.periodicUUID)
            .sort(),
        fakeRoomsData
            .splice(0, 3)
            .map(room => room.periodic_uuid)
            .sort(),
    );

    const roomOwnerUUID = Array.from(new Set(result.data.map(room => room.ownerUUID)));

    ava.is(roomOwnerUUID.length, 1, "today room list has other user");

    ava.is(roomOwnerUUID[0], userUUID, "today room list has other user");
});

test(`${namespace} - has inviteCode`, async ava => {
    const userUUID = v4();

    const roomUUIDs = new Array(30).fill(1).map(() => v4());

    const fakeRoomsData = await Promise.all(
        new Array(30).fill(1).map(async (_v, i) => {
            const beginTime = addHours(i + 1)(Date.now());

            const isEven = i % 2 === 0;

            if (i % 3 !== 0) {
                const inviteCode = (await generateInviteCode())!;
                await RedisService.set(RedisKey.roomInviteCode(inviteCode), roomUUIDs[i]);
                await RedisService.set(RedisKey.roomInviteCodeReverse(roomUUIDs[i]), inviteCode);
            }

            return {
                room_uuid: isEven ? roomUUIDs[i] : v4(),
                periodic_uuid: isEven ? "" : roomUUIDs[i],
                owner_uuid: userUUID,
                title: `inviteCode - ${i}`,
                room_type: RoomType.OneToOne,
                room_status: RoomStatus.Started,
                begin_time: beginTime,
                end_time: addMinutes(30)(beginTime),
                whiteboard_room_uuid: v4().replace("-", ""),
                region: Region.US_SV,
            };
        }),
    );
    const fakeRoomUserData = fakeRoomsData.map(room => ({
        room_uuid: room.room_uuid,
        user_uuid: userUUID,
        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
    }));
    const fakeUserData = {
        user_uuid: userUUID,
        gender: Gender.Man,
        avatar_url: "",
        user_name: "test_user_5",
        user_password: "",
    };

    await Promise.all([
        RoomDAO().insert(fakeRoomsData),
        RoomUserDAO().insert(fakeRoomUserData),
        UserDAO().insert(fakeUserData),
    ]);

    const allList = createList(ListType.All, userUUID);

    const result = (await allList.execute()) as ResponseSuccess<ResponseType>;

    ava.is(result.status, Status.Success);
    ava.is(result.data.length, 30);

    result.data.forEach((room, i) => {
        const isEven = i % 2 === 0;

        if (i % 3 !== 0) {
            ava.true(/\d{10}/.test(room.inviteCode), "invite code must is ten digits");
        } else {
            ava.is(room.inviteCode, isEven ? room.roomUUID : room.periodicUUID!);
        }
    });
});

test.serial(`${namespace} - no room data`, async ava => {
    const userUUID = v4();

    const fakeUserData = {
        user_uuid: userUUID,
        gender: Gender.Man,
        avatar_url: "",
        user_name: "test_user_6",
        user_password: "",
    };

    await UserDAO().insert(fakeUserData);

    const allList = createList(ListType.All, userUUID);

    const result = (await allList.execute()) as ResponseSuccess<ResponseType>;

    ava.is(result.status, Status.Success);
    ava.is(result.data.length, 0);
});

test.serial(`${namespace} - error handler`, async ava => {
    ava.plan(1);

    await dataSource.destroy();

    const periodicList = createList(ListType.Periodic, v4());

    try {
        await periodicList.execute();
    } catch (error) {
        ava.is(periodicList.errorHandler(error).code, ErrorCode.CurrentProcessFailed);
    }

    await dataSource.initialize();
});
