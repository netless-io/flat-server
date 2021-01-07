import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomDocModel } from "../../../model/room/RoomDoc";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomPeriodicModel } from "../../../model/room/RoomPeriodic";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { RoomPeriodicUserModel } from "../../../model/room/RoomPeriodicUser";

export const periodicSubRoomInfo = async (
    req: PatchRequest<{
        Body: PeriodicSubRoomInfoBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { periodicUUID, roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const checkUserInPeriodicRoom = await getRepository(RoomPeriodicUserModel).findOne({
            select: ["id"],
            where: {
                periodic_uuid: periodicUUID,
                user_uuid: userUUID,
                is_delete: false,
            },
        });

        if (checkUserInPeriodicRoom === undefined) {
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            });
        }

        const roomPeriodicInfo = await getRepository(RoomPeriodicModel).findOne({
            select: ["room_status", "begin_time", "end_time", "room_type"],
            where: {
                fake_room_uuid: roomUUID,
                is_delete: false,
            },
        });

        if (roomPeriodicInfo === undefined) {
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            });
        }

        const { room_status, begin_time, end_time, room_type } = roomPeriodicInfo;

        const periodicConfigInfo = await getRepository(RoomPeriodicConfigModel).findOne({
            select: ["title", "owner_uuid"],
            where: {
                periodic_uuid: periodicUUID,
                is_delete: false,
            },
        });

        if (periodicConfigInfo === undefined) {
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            });
        }

        const { title, owner_uuid } = periodicConfigInfo;

        const docs = (
            await getRepository(RoomDocModel).find({
                select: ["doc_type", "doc_uuid", "is_preload"],
                where: {
                    periodic_uuid: periodicUUID,
                    is_delete: false,
                },
            })
        ).map(({ doc_type, doc_uuid, is_preload }) => {
            return {
                docType: doc_type,
                docUUID: doc_uuid,
                isPreload: is_preload,
            };
        });

        return reply.send({
            status: Status.Success,
            data: {
                roomInfo: {
                    title,
                    beginTime: begin_time,
                    endTime: end_time,
                    roomType: room_type,
                    roomStatus: room_status,
                    ownerUUID: owner_uuid,
                },
                docs,
            },
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        });
    }
};

interface PeriodicSubRoomInfoBody {
    roomUUID: string;
    periodicUUID: string;
}

export const periodicSubRoomInfoSchemaType: FastifySchema<{
    body: PeriodicSubRoomInfoBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID", "periodicUUID"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
            periodicUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};
