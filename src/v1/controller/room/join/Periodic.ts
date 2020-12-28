import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { updateDB } from "./Utils";

export const joinPeriodic = async (
    req: PatchRequest<{
        Body: JoinPeriodicBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { periodicUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomPeriodicConfig = await getRepository(RoomPeriodicConfigModel).findOne({
            select: ["periodic_status"],
            where: {
                periodic_uuid: periodicUUID,
                is_delete: false,
            },
        });

        if (roomPeriodicConfig === undefined) {
            return reply.send({
                status: Status.Failed,
                message: "Periodic room not found",
            });
        }

        if (roomPeriodicConfig.periodic_status === RoomStatus.Stopped) {
            return reply.send({
                status: Status.Failed,
                message: "Periodic has been ended",
            });
        }

        const roomInfo = await getRepository(RoomModel)
            .createQueryBuilder()
            .select(["room_uuid", "whiteboard_room_uuid", "owner_user_uuid", "room_status"])
            .where(
                `periodic_uuid = :periodicUUID
                AND room_status IN (:...roomStatus)
                AND is_delete = false`,
                {
                    periodicUUID,
                    roomStatus: [RoomStatus.Pending, RoomStatus.Running],
                },
            )
            .getRawOne();

        // will arrive here in extreme cases, notify user to retry
        if (roomInfo === undefined) {
            return reply.send({
                status: Status.Failed,
                message: "Room has ended or been deleted",
            });
        }

        if (roomInfo.owner_user_uuid === userUUID) {
            if (roomInfo.room_status === RoomStatus.Pending) {
                await updateDB(roomInfo.room_uuid, userUUID, true, periodicUUID);
            }
        } else {
            await updateDB(roomInfo.room_uuid, userUUID);
        }

        return reply.send({
            status: Status.Success,
            data: {
                roomUUID: roomInfo.room_uuid,
                whiteboardRoomToken: createWhiteboardRoomToken(roomInfo.whiteboard_room_uuid),
                whiteboardRoomUUID: roomInfo.whiteboard_room_uuid,
            },
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "Join room failed",
        });
    }
};

interface JoinPeriodicBody {
    periodicUUID: string;
}

export const joinPeriodicSchemaType: FastifySchema<{
    body: JoinPeriodicBody;
}> = {
    body: {
        type: "object",
        required: ["periodicUUID"],
        properties: {
            periodicUUID: {
                type: "string",
                maxLength: 40,
            },
        },
    },
};
