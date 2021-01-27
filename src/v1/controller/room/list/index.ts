import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { createQueryBuilder, In } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { RoomModel } from "../../../model/room/Room";
import { UserModel } from "../../../model/user/User";
import { ListType, RoomStatus, RoomType } from "../Constants";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomRecordDAO } from "../../../dao";

export const list = async (
    req: PatchRequest<{
        Querystring: ListQuery;
        Params: ListParams;
    }>,
): Response<ListResponse> => {
    const { type } = req.params;
    const whereMap = {
        all: {
            sql: `ru.user_uuid = :userUUID
                AND r.room_status NOT IN (:...notRoomStatus)
                AND ru.is_delete = false
                AND r.is_delete = false`,
            params: {
                userUUID: req.user.userUUID,
                notRoomStatus: [RoomStatus.Stopped],
            },
        },
        today: {
            sql: `ru.user_uuid = :userUUID
                AND DATE(r.begin_time) = CURDATE()
                AND r.room_status NOT IN (:...notRoomStatus)
                AND ru.is_delete = false
                AND r.is_delete = false`,
            params: {
                userUUID: req.user.userUUID,
                notRoomStatus: [RoomStatus.Stopped],
            },
        },
        periodic: {
            sql: `ru.user_uuid = :userUUID
                AND r.room_status NOT IN (:...notRoomStatus)
                AND length(r.periodic_uuid) <> 0
                AND ru.is_delete = false
                AND r.is_delete = false`,
            params: {
                userUUID: req.user.userUUID,
                notRoomStatus: [RoomStatus.Stopped],
            },
        },
        history: {
            sql: `ru.user_uuid = :userUUID
                AND r.room_status IN (:...roomStatus)
                AND ru.is_delete = false
                AND r.is_delete = false`,
            params: {
                userUUID: req.user.userUUID,
                roomStatus: [RoomStatus.Stopped],
            },
        },
    };

    try {
        const rooms = await createQueryBuilder(RoomUserModel, "ru")
            .addSelect("r.title", "title")
            .addSelect("r.room_uuid", "room_uuid")
            .addSelect("r.periodic_uuid", "periodic_uuid")
            .addSelect("r.room_type", "room_type")
            .addSelect("r.begin_time", "begin_time")
            .addSelect("r.end_time", "end_time")
            .addSelect("r.owner_uuid", "owner_uuid")
            .addSelect("r.room_status", "room_status")
            .addSelect("u.user_name", "owner_user_name")
            .innerJoin(RoomModel, "r", "ru.room_uuid = r.room_uuid")
            .innerJoin(UserModel, "u", "u.user_uuid = r.owner_uuid")
            .where(whereMap[type].sql, whereMap[type].params)
            .orderBy({
                "r.begin_time": "ASC",
            })
            .offset((req.query.page - 1) * 50)
            .limit(50)
            .getRawMany();

        const resp: ListResponse = rooms.map((room: Room) => {
            return {
                roomUUID: room.room_uuid,
                periodicUUID: room.periodic_uuid || null,
                ownerUUID: room.owner_uuid,
                roomType: room.room_type,
                title: room.title,
                beginTime: room.begin_time.valueOf(),
                endTime: room.end_time.valueOf(),
                roomStatus: room.room_status,
                ownerName: room.owner_user_name,
            };
        });

        if (type === ListType.History) {
            const roomsUUID = rooms.map((room: Room) => room.room_uuid);

            const roomRecordUUIDs = (
                await RoomRecordDAO().find(
                    ["room_uuid"],
                    {
                        room_uuid: In(roomsUUID),
                    },
                    {
                        distinct: true,
                    },
                )
            ).map(record => record.room_uuid);

            resp.forEach(room => {
                room.hasRecord = roomRecordUUIDs.includes(room.roomUUID);
            });
        }

        return {
            status: Status.Success,
            data: resp,
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface ListQuery {
    page: number;
}

interface ListParams {
    type: ListType;
}

export const listSchemaType: FastifySchema<{
    querystring: ListQuery;
    params: ListParams;
}> = {
    querystring: {
        type: "object",
        required: ["page"],
        properties: {
            page: {
                type: "integer",
                maximum: 50,
                minimum: 1,
            },
        },
    },
    params: {
        type: "object",
        required: ["type"],
        properties: {
            type: {
                type: "string",
                enum: [ListType.All, ListType.Today, ListType.Periodic, ListType.History],
            },
        },
    },
};

type ListResponse = Array<{
    roomUUID: string;
    periodicUUID: string | null;
    roomType: RoomType;
    ownerUUID: string;
    title: string;
    beginTime: number;
    endTime: number;
    roomStatus: RoomStatus;
    ownerName: string;
    hasRecord?: boolean;
}>;

interface Room {
    room_uuid: string;
    periodic_uuid: string;
    owner_uuid: string;
    room_type: RoomType;
    title: string;
    begin_time: Date;
    end_time: Date;
    room_status: RoomStatus;
    owner_user_name: string;
}
