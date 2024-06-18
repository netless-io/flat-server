import test from "ava";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { addHours, addMinutes, subMinutes } from "date-fns/fp";
import { RoomType } from "../../../../../model/room/Constants";
import { Region, Status } from "../../../../../constants/Project";
import sinon from "sinon";
import { ax } from "../../../../utils/Axios";
import { FilterValue, removeEmptyValue } from "../../../../../utils/Object";
import { createOrdinaryFn } from "./helpers/createOrdinaryFn";
import { ErrorCode } from "../../../../../ErrorCode";

const namespace = "[api][api-v1][api-room][api-room-create][api-room-create-ordinary]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - create normal`, async ava => {
    const [userUUID, whiteboardRoomUUID] = [v4(), v4().replace("-", "")];
    const beginTime = Date.now();
    const endTime = addHours(1)(beginTime).valueOf();

    const createOrdinary = createOrdinaryFn(userUUID, {
        title: "test",
        type: RoomType.OneToOne,
        region: Region.CN_HZ,
        beginTime,
        endTime,
    });

    // TODO: possibility of failure exists
    const stubAxios = sinon.stub(ax, "post").resolves(
        Promise.resolve({
            data: {
                uuid: whiteboardRoomUUID,
            },
        }),
    );

    const result = await createOrdinary.execute();

    ava.is(result.status, Status.Success);

    const roomInfo = removeEmptyValue(
        await createOrdinary.svc.room.assertInfo([
            "owner_uuid",
            "region",
            "title",
            "whiteboard_room_uuid",
        ]),
        [FilterValue.UNDEFINED],
    );

    ava.deepEqual(
        {
            region: roomInfo.region,
            title: roomInfo.title,
            whiteboard_room_uuid: roomInfo.whiteboard_room_uuid,
            owner_uuid: roomInfo.owner_uuid,
        },
        {
            region: Region.CN_HZ,
            title: "test",
            whiteboard_room_uuid: whiteboardRoomUUID,
            owner_uuid: userUUID,
        },
    );

    stubAxios.restore();
});

test(`${namespace} - only has end time`, async ava => {
    ava.plan(1);

    const userUUID = v4();
    const endTime = addHours(1)(Date.now()).valueOf();

    const createOrdinary = createOrdinaryFn(userUUID, {
        title: "test",
        type: RoomType.OneToOne,
        region: Region.CN_HZ,
        endTime,
    });

    try {
        await createOrdinary.execute();
    } catch (error) {
        ava.is(createOrdinary.errorHandler(error).code, ErrorCode.ParamsCheckFailed);
    }
});

test(`${namespace} - begin time less end time`, async ava => {
    ava.plan(1);

    const userUUID = v4();
    const beginTime = Date.now();
    const endTime = subMinutes(1)(beginTime).valueOf();

    const createOrdinary = createOrdinaryFn(userUUID, {
        title: "test",
        type: RoomType.OneToOne,
        region: Region.US_SV,
        beginTime,
        endTime,
    });

    try {
        await createOrdinary.execute();
    } catch (error) {
        ava.is(createOrdinary.errorHandler(error).code, ErrorCode.ParamsCheckFailed);
    }
});

test(`${namespace} - time interval less than fifteen minute`, async ava => {
    ava.plan(1);

    const userUUID = v4();
    const beginTime = Date.now();
    const endTime = addMinutes(14)(beginTime).valueOf();

    const createOrdinary = createOrdinaryFn(userUUID, {
        title: "test",
        type: RoomType.OneToOne,
        region: Region.SG,
        beginTime,
        endTime,
    });

    try {
        await createOrdinary.execute();
    } catch (error) {
        ava.is(createOrdinary.errorHandler(error).code, ErrorCode.ParamsCheckFailed);
    }
});
