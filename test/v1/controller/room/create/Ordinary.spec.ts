import { describe } from "mocha";
import { expect } from "chai";
import { v4 } from "uuid";
import { Logger } from "../../../../../src/logger";
import { ControllerClassParams } from "../../../../../src/abstract/controller";
import { CreateOrdinary, RequestType } from "../../../../../src/v1/controller/room/create/Ordinary";
import sinon from "sinon";
import { ax } from "../../../../../src/v1/utils/Axios";
import { Connection } from "typeorm";
import { orm } from "../../../../../src/thirdPartyService/TypeORMService";
import { RoomType } from "../../../../../src/model/room/Constants";
import { Region, Status } from "../../../../../src/constants/Project";
import assert from "assert";
import { addHours, addMinutes, subMinutes } from "date-fns/fp";
import { ErrorCode } from "../../../../../src/ErrorCode";
import { ResponseError } from "../../../../../src/types/Server";

describe("v1 create room", () => {
    let connection: Connection;
    before(async () => {
        connection = await orm();
        await connection.synchronize(true);
    });
    after(() => connection.close());

    const logger = new Logger<any>("test", {}, []);

    const userUUID = v4();

    const createOrdinaryFn = (body: RequestType["body"]): CreateOrdinary => {
        return new CreateOrdinary({
            logger,
            req: {
                body,
                user: {
                    userUUID,
                },
            },
            reply: {},
        } as ControllerClassParams);
    };

    it("create normal", async () => {
        const whiteboardRoomUUID = v4().replace("-", "");
        const beginTime = Date.now();
        const endTime = addHours(1)(beginTime).valueOf();

        const createOrdinary = createOrdinaryFn({
            title: "test",
            type: RoomType.OneToOne,
            region: Region.CN_HZ,
            beginTime,
            endTime,
        });

        const stubAxios = sinon.stub(ax, "post").resolves(
            Promise.resolve({
                data: {
                    uuid: whiteboardRoomUUID,
                },
            }),
        );

        const result = await createOrdinary.execute();

        expect(result.status).eq(Status.Success);

        assert(result.status === Status.Success);

        const roomInfo = await createOrdinary.svc.room.info([
            "owner_uuid",
            "region",
            "title",
            "whiteboard_room_uuid",
        ]);

        expect(roomInfo.region).eq(Region.CN_HZ);
        expect(roomInfo.title).eq("test");
        expect(roomInfo.whiteboard_room_uuid).eq(whiteboardRoomUUID);
        expect(roomInfo.owner_uuid).eq(userUUID);

        stubAxios.restore();
    });

    it("begin time is one minute earlier than now", async () => {
        const beginTime = subMinutes(2)(Date.now()).valueOf();
        const endTime = addHours(1)(beginTime).valueOf();

        const createOrdinary = createOrdinaryFn({
            title: "test",
            type: RoomType.OneToOne,
            region: Region.CN_HZ,
            beginTime,
            endTime,
        });

        let errorResult: ResponseError | null;

        try {
            await createOrdinary.execute();
            errorResult = null;
        } catch (error) {
            errorResult = createOrdinary.errorHandler(error);
        }

        expect(errorResult!.code).eq(ErrorCode.ParamsCheckFailed);
    });

    it("begin time less end time", async () => {
        const beginTime = Date.now();
        const endTime = subMinutes(1)(beginTime).valueOf();

        const createOrdinary = createOrdinaryFn({
            title: "test",
            type: RoomType.OneToOne,
            region: Region.US_SV,
            beginTime,
            endTime,
        });

        let errorResult: ResponseError | null;

        try {
            await createOrdinary.execute();
            errorResult = null;
        } catch (error) {
            errorResult = createOrdinary.errorHandler(error);
        }

        expect(errorResult!.code).eq(ErrorCode.ParamsCheckFailed);
    });

    it("time interval less than fifteen minute", async () => {
        const beginTime = Date.now();
        const endTime = addMinutes(14)(beginTime).valueOf();

        const createOrdinary = createOrdinaryFn({
            title: "test",
            type: RoomType.OneToOne,
            region: Region.SG,
            beginTime,
            endTime,
        });

        let errorResult: ResponseError | null;

        try {
            await createOrdinary.execute();
            errorResult = null;
        } catch (error) {
            errorResult = createOrdinary.errorHandler(error);
        }

        expect(errorResult!.code).eq(ErrorCode.ParamsCheckFailed);
    });
});
