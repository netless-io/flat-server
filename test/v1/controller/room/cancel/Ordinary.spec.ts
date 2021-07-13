import { describe } from "mocha";
import { expect } from "chai";
import { CancelOrdinary } from "../../../../../src/v1/controller/room/cancel/Ordinary";
import { v4 } from "uuid";
import { ErrorCode } from "../../../../../src/ErrorCode";
import { Logger } from "../../../../../src/logger";
import { ControllerClassParams } from "../../../../../src/abstract/controller";
import { ResponseError } from "../../../../../src/types/Server";
import { Connection } from "typeorm";
import { orm } from "../../../../../src/thirdPartyService/TypeORMService";
import { RoomDAO, RoomUserDAO } from "../../../../../src/dao";
import { Region } from "../../../../../src/constants/Project";
import { addMinutes } from "date-fns/fp";
import { RoomStatus, RoomType } from "../../../../../src/model/room/Constants";
import cryptoRandomString from "crypto-random-string";

describe("v1 cancel room", () => {
    let connection: Connection;
    before(async () => {
        connection = await orm();
    });
    after(() => connection.close());
    beforeEach(async () => {
        await connection.synchronize(true);
    });

    const logger = new Logger<any>("test", {}, []);

    const createCancelOrdinary = (userUUID: string, roomUUID: string): CancelOrdinary => {
        return new CancelOrdinary({
            logger,
            req: {
                body: {
                    roomUUID,
                },
                user: {
                    userUUID,
                },
            },
            reply: {},
        } as ControllerClassParams);
    };

    it("room not found", async () => {
        const [userUUID, roomUUID] = [v4(), v4()];

        const cancelOrdinary = createCancelOrdinary(userUUID, roomUUID);

        let errorResult: ResponseError | null = null;

        try {
            await cancelOrdinary.execute();
        } catch (error) {
            errorResult = cancelOrdinary.errorHandler(error);
        }

        expect(errorResult?.code).eq(ErrorCode.RoomNotFound);
    });

    it("room is periodic sub room", async () => {
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

        let errorResult: ResponseError | null = null;

        try {
            await cancelOrdinary.execute();
        } catch (error) {
            errorResult = cancelOrdinary.errorHandler(error);
        }

        expect(errorResult?.code).eq(ErrorCode.NotPermission);
    });

    it("user is room owner and room is running", async () => {
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

        let errorResult: ResponseError | null = null;

        try {
            await cancelOrdinary.execute();
        } catch (error) {
            errorResult = cancelOrdinary.errorHandler(error);
        }

        expect(errorResult?.code).eq(ErrorCode.RoomIsRunning);
    });

    it("student cancel room", async () => {
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

            expect(result).length(0, "remove self failed in room user table");
        }

        {
            const result = await RoomDAO().find(["room_uuid", "owner_uuid"], {
                owner_uuid: ownerUUID,
            });

            expect(result).length(1, "students should not have the right to delete room");
            expect(result[0].room_uuid).eq(roomUUID);
            expect(result[0].owner_uuid).eq(ownerUUID);
        }
    });

    it("owner cancel room", async () => {
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
    });
});
