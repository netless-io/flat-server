import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getConnection, getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { RoomPeriodicModel } from "../../../model/room/RoomPeriodic";

export const running = async (
    req: PatchRequest<{
        Body: RunningBody;
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

        // only the room owner can call this API
        if (roomInfo.owner_uuid !== userUUID) {
            return reply.send({
                status: Status.Failed,
                message: "Not have permission",
            });
        }

        // if the room is running, return
        if (roomInfo.room_status === RoomStatus.Running) {
            return reply.send({
                status: Status.Success,
            });
        }

        if (roomInfo.room_status === RoomStatus.Stopped) {
            return reply.send({
                status: Status.Failed,
                message: "Room has been ended",
            });
        }

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            const beginTime = new Date();
            commands.push(
                t
                    .createQueryBuilder()
                    .update(RoomModel)
                    .set({
                        room_status: RoomStatus.Running,
                        begin_time: beginTime,
                    })
                    .where({
                        room_uuid: roomUUID,
                        is_delete: false,
                    })
                    .execute(),
            );

            if (roomInfo.periodic_uuid !== "") {
                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomPeriodicConfigModel)
                        .set({
                            periodic_status: RoomStatus.Running,
                        })
                        .where({
                            periodic_uuid: roomInfo.periodic_uuid,
                            periodic_status: RoomStatus.Pending,
                            is_delete: false,
                        })
                        .execute(),
                );

                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomPeriodicModel)
                        .set({
                            room_status: RoomStatus.Running,
                            begin_time: beginTime,
                        })
                        .where({
                            fake_room_uuid: roomUUID,
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
            message: "Set room status is running failed",
        });
    }
};

interface RunningBody {
    roomUUID: string;
}

export const runningSchemaType: FastifySchema<{
    body: RunningBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuidV4",
            },
        },
    },
};
