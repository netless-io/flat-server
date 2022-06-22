import test from "ava";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { RoomDAO } from "../../../../dao";
import { Region } from "../../../../constants/Project";
import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import { addHours, addMinutes } from "date-fns/fp";
import { ServiceRoom } from "../Room";
import { FilterValue, removeEmptyValue } from "../../../../utils/Object";
import sinon from "sinon";
import { ax } from "../../../utils/Axios";

const namespace = "[service][service-room]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - assert exist room`, async ava => {
    const [roomUUID, userUUID] = [v4(), v4()];

    await RoomDAO().insert({
        room_uuid: roomUUID,
        owner_uuid: userUUID,
        periodic_uuid: "",
        title: "test",
        region: Region.CN_HZ,
        room_type: RoomType.OneToOne,
        room_status: RoomStatus.Idle,
        whiteboard_room_uuid: v4().replace("-", ""),
        begin_time: new Date(),
        end_time: addMinutes(30)(Date.now()),
    });

    {
        const serviceRoom = new ServiceRoom(roomUUID, userUUID);

        await ava.notThrowsAsync(serviceRoom.assertExist());
    }

    {
        const serviceRoom = new ServiceRoom(v4(), userUUID);

        await ava.throwsAsync(serviceRoom.assertExist());
    }
});

test(`${namespace} - room info`, async ava => {
    const [roomUUID, userUUID, whiteboardRoomUUID] = [v4(), v4(), v4().replace("-", "")];

    await RoomDAO().insert({
        room_uuid: roomUUID,
        owner_uuid: userUUID,
        periodic_uuid: "",
        title: "test",
        region: Region.CN_HZ,
        room_type: RoomType.OneToOne,
        room_status: RoomStatus.Idle,
        whiteboard_room_uuid: whiteboardRoomUUID,
        begin_time: new Date(),
        end_time: addMinutes(40)(Date.now()),
    });

    {
        const serviceRoom = new ServiceRoom(roomUUID, userUUID);

        const result = removeEmptyValue(
            await serviceRoom.assertInfo(["owner_uuid", "whiteboard_room_uuid"]),
            [FilterValue.UNDEFINED],
        );

        ava.deepEqual(
            {
                whiteboard_room_uuid: result.whiteboard_room_uuid,
                owner_uuid: result.owner_uuid,
            },
            {
                whiteboard_room_uuid: whiteboardRoomUUID,
                owner_uuid: userUUID,
            },
        );
    }

    {
        const serviceRoom = new ServiceRoom(v4(), userUUID);

        await ava.throwsAsync(serviceRoom.assertInfo(["id"]));
    }
});

test(`${namespace} - room info by owner`, async ava => {
    const [roomUUID, userUUID, whiteboardRoomUUID] = [v4(), v4(), v4().replace("-", "")];

    await RoomDAO().insert({
        room_uuid: roomUUID,
        owner_uuid: userUUID,
        periodic_uuid: "",
        title: "test",
        region: Region.CN_HZ,
        room_type: RoomType.OneToOne,
        room_status: RoomStatus.Idle,
        whiteboard_room_uuid: whiteboardRoomUUID,
        begin_time: new Date(),
        end_time: addMinutes(40)(Date.now()),
    });

    {
        const serviceRoom = new ServiceRoom(roomUUID, userUUID);

        const result = removeEmptyValue(
            await serviceRoom.assertInfoByOwner(["whiteboard_room_uuid"]),
            [FilterValue.UNDEFINED],
        );

        ava.is(result.whiteboard_room_uuid, whiteboardRoomUUID);
    }

    {
        const serviceRoom = new ServiceRoom(roomUUID, v4());

        await ava.throwsAsync(serviceRoom.assertInfoByOwner(["id"]));
    }
});

test(`${namespace} - create room`, async ava => {
    {
        const [roomUUID, userUUID, whiteboardRoomUUID, beginTime] = [
            v4(),
            v4(),
            v4().replace("-", ""),
            Date.now(),
        ];

        // TODO: possibility of failure exists
        // because src/v1/utils/request/whiteboard/whiteboardRequest.test.ts will also rewrite it
        // because unit tests are done based on ava concurrency.
        // we should write a helper method
        // if ax has been rewritten, the blocking operation is performed. Until the original ax is restore
        const stubAxios = sinon.stub(ax, "post").resolves(
            Promise.resolve({
                data: {
                    uuid: whiteboardRoomUUID,
                },
            }),
        );

        const serviceRoom = new ServiceRoom(roomUUID, userUUID);

        await serviceRoom.create({
            title: "test",
            region: Region.SG,
            type: RoomType.OneToOne,
            beginTime: beginTime,
            endTime: addMinutes(40)(beginTime),
        });

        const result = removeEmptyValue(
            await serviceRoom.assertInfo(["owner_uuid", "whiteboard_room_uuid", "end_time"]),
            [FilterValue.UNDEFINED],
        );

        ava.deepEqual(
            {
                owner_uuid: result.owner_uuid,
                whiteboard_room_uuid: result.whiteboard_room_uuid,
                end_time: result.end_time,
            },
            {
                owner_uuid: userUUID,
                whiteboard_room_uuid: whiteboardRoomUUID,
                end_time: addMinutes(40)(beginTime),
            },
        );

        stubAxios.restore();
    }

    // test auto fill end time
    {
        const [roomUUID, userUUID, whiteboardRoomUUID, beginTime] = [
            v4(),
            v4(),
            v4().replace("-", ""),
            Date.now(),
        ];

        // TODO: possibility of failure exists
        const stubAxios = sinon.stub(ax, "post").resolves(
            Promise.resolve({
                data: {
                    uuid: whiteboardRoomUUID,
                },
            }),
        );

        const serviceRoom = new ServiceRoom(roomUUID, userUUID);

        await serviceRoom.create({
            title: "test",
            region: Region.CN_HZ,
            type: RoomType.OneToOne,
            beginTime: beginTime,
        });

        const result = removeEmptyValue(
            await serviceRoom.assertInfo(["end_time", "owner_uuid", "whiteboard_room_uuid"]),
            [FilterValue.UNDEFINED],
        );

        ava.deepEqual(
            {
                owner_uuid: result.owner_uuid,
                whiteboard_room_uuid: result.whiteboard_room_uuid,
                end_time: result.end_time,
            },
            {
                owner_uuid: userUUID,
                whiteboard_room_uuid: whiteboardRoomUUID,
                end_time: addHours(1)(beginTime),
            },
        );

        stubAxios.restore();
    }
});

test(`${namespace} - remove room`, async ava => {
    const [roomUUID, userUUID] = [v4(), v4(), Date.now()];

    await RoomDAO().insert({
        title: "test",
        owner_uuid: userUUID,
        region: Region.CN_HZ,
        room_type: RoomType.OneToOne,
        room_status: RoomStatus.Started,
        whiteboard_room_uuid: v4().replace("-", ""),
        begin_time: new Date(),
        end_time: addMinutes(30)(Date.now()),
        room_uuid: roomUUID,
        periodic_uuid: "",
    });

    const serviceRoom = new ServiceRoom(roomUUID, userUUID);

    await serviceRoom.remove();

    const result = await RoomDAO().find(["id"], {
        owner_uuid: userUUID,
    });

    ava.is(result.length, 0);
});
