import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getConnection, getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { RoomUserModel } from "../../../model/room/RoomUser";

export const cancelOrdinary = async (
    req: PatchRequest<{
        Body: CancelOrdinaryBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomInfo = await getRepository(RoomModel).findOne({
            select: ["room_status", "owner_uuid", "periodic_uuid"],
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

        if (roomInfo.periodic_uuid !== "") {
            return reply.send({
                status: Status.Failed,
                message: "Does not support cancel of sub-rooms under periodic rooms",
            });
        }

        // the owner of the room cannot delete this lesson while the room is running
        if (roomInfo.owner_uuid === userUUID && roomInfo.room_status === RoomStatus.Running) {
            return reply.send({
                status: Status.Failed,
                message: "Cannot cancel when the room is running",
            });
        }

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                t
                    .createQueryBuilder()
                    .update(RoomUserModel)
                    .set({
                        is_delete: true,
                    })
                    .where({
                        room_uuid: roomUUID,
                        user_uuid: userUUID,
                        is_delete: false,
                    })
                    .execute(),
            );

            if (roomInfo.owner_uuid === userUUID && roomInfo.room_status === RoomStatus.Pending) {
                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomModel)
                        .set({
                            is_delete: true,
                        })
                        .where({
                            room_uuid: roomUUID,
                            is_delete: false,
                        })
                        .execute(),
                );
            }

            return await Promise.all(commands);
        });

        return reply.send({
            status: Status.Success,
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "Cancel room failed",
        });
    }
};

interface CancelOrdinaryBody {
    roomUUID: string;
}

export const cancelOrdinarySchemaType: FastifySchema<{
    body: CancelOrdinaryBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                maxLength: 40,
            },
        },
    },
};
