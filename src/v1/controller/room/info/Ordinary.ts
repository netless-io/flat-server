import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRepository } from "typeorm";
import { DefaultDatetime, Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomDocModel } from "../../../model/room/RoomDoc";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { isEqual } from "date-fns/fp";
import { ErrorCode } from "../../../../ErrorCode";

export const ordinaryInfo = async (
    req: PatchRequest<{
        Body: OrdinaryInfoBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { roomUUID } = req.body;
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
                code: ErrorCode.NotPermission,
            });
        }

        const roomInfo = await getRepository(RoomModel).findOne({
            select: ["title", "begin_time", "end_time", "room_type", "room_status", "owner_uuid"],
            where: {
                room_uuid: roomUUID,
                is_delete: false,
            },
        });

        if (roomInfo === undefined) {
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            });
        }

        const docs = (
            await getRepository(RoomDocModel).find({
                select: ["doc_type", "doc_uuid", "is_preload"],
                where: {
                    room_uuid: roomUUID,
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
                    title: roomInfo.title,
                    beginTime: roomInfo.begin_time,
                    endTime: isEqual(roomInfo.end_time)(DefaultDatetime)
                        ? ""
                        : roomInfo.end_time.toISOString(),
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
            code: ErrorCode.CurrentProcessFailed,
        });
    }
};

interface OrdinaryInfoBody {
    roomUUID: string;
}

export const OrdinaryInfoSchemaType: FastifySchema<{
    body: OrdinaryInfoBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};
