import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomDocModel } from "../../../model/room/RoomDoc";
import { RoomUserModel } from "../../../model/room/RoomUser";

export const roomInfo = async (
    req: PatchRequest<{
        Body: RoomInfoBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { queryDocs, roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const checkUserExistRoom = await getRepository(RoomUserModel).findOne({
            select: ["id"],
            where: {
                user_uuid: userUUID,
                room_uuid: roomUUID,
                is_delete: false,
            },
        });

        if (checkUserExistRoom === undefined) {
            return reply.send({
                status: Status.Failed,
                message: "Not have permission",
            });
        }

        const roomInfo = await getRepository(RoomModel).findOne({
            select: [
                "title",
                "begin_time",
                "end_time",
                "room_type",
                "room_status",
                "owner_uuid",
                "periodic_uuid",
            ],
            where: {
                room_uuid: roomUUID,
                is_delete: false,
            },
        });

        if (roomInfo === undefined) {
            return reply.send({
                status: Status.Failed,
                message: "Room not found",
            });
        }

        const docs = (
            await (async () => {
                if (!queryDocs) {
                    return [];
                }

                const where: DocsWhere = {
                    is_delete: false,
                };

                if (roomInfo.periodic_uuid) {
                    where.periodic_uuid = roomInfo.periodic_uuid;
                } else {
                    where.room_uuid = roomUUID;
                }

                return await getRepository(RoomDocModel).find({
                    select: ["doc_type", "doc_uuid", "is_preload"],
                    where,
                });
            })()
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
                    title: roomInfo.title,
                    beginTime: roomInfo.begin_time,
                    endTime: roomInfo.end_time,
                    roomType: roomInfo.room_type,
                    roomStatus: roomInfo.room_status,
                    ownerUUID: roomInfo.owner_uuid,
                },
                docs,
            },
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "get room info failed",
        });
    }
};

interface RoomInfoBody {
    roomUUID: string;
    queryDocs: boolean;
}

export const roomInfoSchemaType: FastifySchema<{
    body: RoomInfoBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                maxLength: 40,
            },
            queryDocs: {
                type: "boolean",
            },
        },
    },
};

type DocsWhere = {
    is_delete: boolean;
    room_uuid?: string;
    periodic_uuid?: string;
};
