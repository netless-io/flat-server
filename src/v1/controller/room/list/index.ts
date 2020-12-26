import { FastifySchema, PatchRequest } from "../../../types/Server";
import { FastifyReply } from "fastify";
import { createQueryBuilder } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { RoomModel } from "../../../model/room/Room";
import { UserModel } from "../../../model/user/User";
import { ListType, RoomStatus } from "../Constants";
import { DefaultDatetime, Status } from "../../../../Constants";
import { isEqual } from "date-fns/fp";

export const list = async (
    req: PatchRequest<{
        Querystring: ListQuery;
        Params: ListParams;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { type } = req.params;
    const whereMap = {
        all: {
            sql: `ru.user_uuid = :userUUID
                AND r.room_status IN (:...roomStatus)
                AND ru.is_delete = false
                AND r.is_delete = false`,
            params: {
                userUUID: req.user.userUUID,
                roomStatus: [RoomStatus.Pending, RoomStatus.Running],
            },
        },
        today: {
            sql: `ru.user_uuid = :userUUID
                AND DATE(r.begin_time) = CURDATE()
                AND r.room_status IN (:...roomStatus)
                AND ru.is_delete = false
                AND r.is_delete = false`,
            params: {
                userUUID: req.user.userUUID,
                roomStatus: [RoomStatus.Pending, RoomStatus.Running],
            },
        },
        periodic: {
            sql: `ru.user_uuid = :userUUID
                AND r.room_status IN (:...roomStatus)
                AND length(r.periodic_uuid) <> 0
                AND ru.is_delete = false
                AND r.is_delete = false`,
            params: {
                userUUID: req.user.userUUID,
                roomStatus: [RoomStatus.Pending, RoomStatus.Running],
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
            .addSelect("r.begin_time", "begin_time")
            .addSelect("r.end_time", "end_time")
            .addSelect("r.creator_user_uuid", "creator_user_uuid")
            .addSelect("r.room_status", "room_status")
            .addSelect("u.user_name", "creator_user_name")
            .innerJoin(RoomModel, "r", "ru.room_uuid = r.room_uuid")
            .innerJoin(UserModel, "u", "u.user_uuid = r.creator_user_uuid")
            .where(whereMap[type].sql, whereMap[type].params)
            .orderBy({
                "r.begin_time": "ASC",
            })
            .offset((req.query.page - 1) * 50)
            .limit(50)
            .getRawMany();

        const resp: Resp[] = rooms.map((room: Room) => {
            return {
                roomUUID: room.room_uuid,
                periodicUUID: room.periodic_uuid,
                creatorUserUUID: room.creator_user_uuid,
                title: room.title,
                beginTime: room.begin_time.toISOString(),
                endTime: isEqual(room.end_time)(DefaultDatetime) ? "" : room.end_time.toISOString(),
                roomStatus: room.room_status,
                creatorUserName: room.creator_user_name,
            };
        });

        return reply.send({
            status: Status.Success,
            data: resp,
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "Error in querying room list",
        });
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

interface Room {
    room_uuid: string;
    periodic_uuid: string;
    creator_user_uuid: string;
    title: string;
    begin_time: Date;
    end_time: Date;
    room_status: RoomStatus;
    creator_user_name: string;
}

type Resp = {
    roomUUID: string;
    periodicUUID: string;
    creatorUserUUID: string;
    title: string;
    beginTime: string;
    endTime: string;
    roomStatus: RoomStatus;
    creatorUserName: string;
};
