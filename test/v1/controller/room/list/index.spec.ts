import { describe } from "mocha";
import { v4 } from "uuid";
import { Logger } from "../../../../../src/logger";
import { ControllerClassParams } from "../../../../../src/abstract/controller";
import { Connection } from "typeorm";
import { orm } from "../../../../../src/thirdPartyService/TypeORMService";
import { ListType, RoomStatus, RoomType } from "../../../../../src/model/room/Constants";
import { Gender, Region, Status } from "../../../../../src/constants/Project";
import { addDays, addHours, addMinutes, startOfDay, subMinutes } from "date-fns/fp";
import { List, ResponseType } from "../../../../../src/v1/controller/room/list";
import { RoomDAO, RoomRecordDAO, RoomUserDAO, UserDAO } from "../../../../../src/dao";
import cryptoRandomString from "crypto-random-string";
import { expect } from "chai";
import { ResponseError, ResponseSuccess } from "../../../../../src/types/Server";
import { isASC, isDESC } from "../../../../test-utils/Sort";
import { ErrorCode } from "../../../../../src/ErrorCode";

describe("v1 list room", () => {
    let connection: Connection;
    before(async () => {
        connection = await orm();
    });
    after(() => connection.close());
    beforeEach(async () => {
        await connection.synchronize(true);
    });

    const logger = new Logger<any>("test", {}, []);

    const userUUID = v4();

    const createList = (type: string): List => {
        return new List({
            logger,
            req: {
                body: {},
                query: {
                    page: 1,
                },
                params: {
                    type,
                },
                user: {
                    userUUID,
                },
            },
            reply: {},
        } as ControllerClassParams);
    };

    it("list history normal", async () => {
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

        const historyList = createList(ListType.History);

        const result = (await historyList.execute()) as ResponseSuccess<ResponseType>;

        expect(result.status).eq(Status.Success);
        expect(result.data).length(50);

        const hasRecordRooms = result.data
            .filter(room => room.hasRecord)
            .map(room => room.roomUUID)
            .sort();
        expect(fakeRoomRecordData.map(room => room.room_uuid).sort()).deep.eq(hasRecordRooms);

        expect(isDESC(result.data.map(room => room.beginTime.valueOf()))).eq(
            true,
            "history room list is not in desc order according to begin_time",
        );
    });

    it("list history duplicate data", async () => {
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

        const historyList = createList(ListType.History);

        const result = (await historyList.execute()) as ResponseSuccess<ResponseType>;

        expect(result.status).eq(Status.Success);
        expect(result.data).length(1);
    });

    it("list all normal", async () => {
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

        const allList = createList(ListType.All);

        const result = (await allList.execute()) as ResponseSuccess<ResponseType>;

        expect(result.status).eq(Status.Success);
        expect(result.data).length(20);
        expect(result.data.filter(room => room.roomStatus === RoomStatus.Idle)).length(10);
        expect(isASC(result.data.map(room => room.beginTime.valueOf()))).eq(
            true,
            "history room list is not in asc order according to begin_time",
        );
    });

    it("list today normal", async () => {
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

        const todayList = createList(ListType.Today);

        const result = (await todayList.execute()) as ResponseSuccess<ResponseType>;

        expect(result.status).eq(Status.Success);
        expect(result.data).length(15);
        expect(Array.from(new Set(result.data.map(room => room.ownerUUID)))[0]).eq(
            userUUID,
            "today room list has other user",
        );
    });

    it("list periodic normal", async () => {
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

        const periodicList = createList(ListType.Periodic);

        const result = (await periodicList.execute()) as ResponseSuccess<ResponseType>;

        expect(result.status).eq(Status.Success);
        expect(result.data).length(3);
        expect(
            result.data
                .filter(room => !!room.periodicUUID)
                .map(room => room.periodicUUID)
                .sort(),
        ).deep.eq(
            fakeRoomsData
                .splice(0, 3)
                .map(room => room.periodic_uuid)
                .sort(),
        );

        const roomOwnerUUID = Array.from(new Set(result.data.map(room => room.ownerUUID)));

        expect(roomOwnerUUID).length(1, "today room list has other user");

        expect(roomOwnerUUID[0]).eq(userUUID, "today room list has other user");
    });

    it("error handler", async () => {
        await connection.close();

        const periodicList = createList(ListType.Periodic);

        let errorResult: ResponseError | null = null;
        try {
            await periodicList.execute();
        } catch (error) {
            errorResult = periodicList.errorHandler(error);
        }

        expect(errorResult!.code).eq(ErrorCode.CurrentProcessFailed);

        await connection.connect();
    });
});
