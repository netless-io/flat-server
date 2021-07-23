import { describe } from "mocha";
import { expect } from "chai";
import { Connection } from "typeorm";
import { orm } from "../../../../src/thirdPartyService/TypeORMService";
import { RoomDAO } from "../../../../src/dao";
import { v4 } from "uuid";
import { Region } from "../../../../src/constants/Project";
import { RoomStatus, RoomType } from "../../../../src/model/room/Constants";
import { addHours, addMinutes } from "date-fns/fp";
import { ServiceRoom } from "../../../../src/v1/service";
import sinon from "sinon";
import { ax } from "../../../../src/v1/utils/Axios";
import { FilterValue, removeEmptyValue } from "../../../../src/utils/Object";

describe("Service room", () => {
    let connection: Connection;
    before(async () => {
        connection = await orm();
        await connection.synchronize(true);
    });
    after(() => connection.close());

    it("assert exist room", async () => {
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

            const result = await serviceRoom
                .assertExist()
                .then(() => true)
                .catch(() => false);

            expect(result).eq(true, "result should exist room");
        }

        {
            const serviceRoom = new ServiceRoom(v4(), userUUID);

            const result = await serviceRoom
                .assertExist()
                .then(() => true)
                .catch(() => false);

            expect(result).eq(false, "result should not exist room");
        }
    });

    it("room info", async () => {
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

            expect(result).deep.eq({
                whiteboard_room_uuid: whiteboardRoomUUID,
                owner_uuid: userUUID,
            });
        }

        {
            const serviceRoom = new ServiceRoom(v4(), userUUID);

            const result = await (async () => {
                try {
                    await serviceRoom.assertInfo(["id"]);
                } catch (error: unknown) {
                    return error as Error;
                }

                return;
            })();

            expect(result).instanceof(Error);
        }
    });

    it("room info by owner", async () => {
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

            expect(result).deep.eq({
                whiteboard_room_uuid: whiteboardRoomUUID,
            });
        }

        {
            const serviceRoom = new ServiceRoom(roomUUID, v4());

            const result = await (async () => {
                try {
                    await serviceRoom.assertInfoByOwner(["id"]);
                } catch (error: unknown) {
                    return error as Error;
                }

                return;
            })();

            expect(result).instanceof(Error);
        }
    });

    it("create room", async () => {
        {
            const [roomUUID, userUUID, whiteboardRoomUUID, beginTime] = [
                v4(),
                v4(),
                v4().replace("-", ""),
                Date.now(),
            ];

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

            expect(result).deep.eq({
                owner_uuid: userUUID,
                whiteboard_room_uuid: whiteboardRoomUUID,
                end_time: addMinutes(40)(beginTime),
            });

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

            expect(result).deep.eq({
                owner_uuid: userUUID,
                whiteboard_room_uuid: whiteboardRoomUUID,
                end_time: addHours(1)(beginTime),
            });

            stubAxios.restore();
        }
    });

    it("remove room", async () => {
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

        expect(result).length(0);
    });
});
