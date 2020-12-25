import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomCyclicalConfigModel } from "../../../model/room/RoomCyclicalConfig";
import { updateDB } from "./Utils";

export const joinCyclical = async (
    req: PatchRequest<{
        Body: JoinCyclicalBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { cyclicalUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomCyclicalConfig = await getRepository(RoomCyclicalConfigModel).findOne({
            select: ["cyclical_status"],
            where: {
                cyclical_uuid: cyclicalUUID,
                is_delete: false,
            },
        });

        if (roomCyclicalConfig === undefined) {
            return reply.send({
                status: Status.Failed,
                message: "Cyclical room not found",
            });
        }

        if (roomCyclicalConfig.cyclical_status === RoomStatus.Stopped) {
            return reply.send({
                status: Status.Failed,
                message: "Cyclical has been ended",
            });
        }

        const roomInfo = await getRepository(RoomModel)
            .createQueryBuilder()
            .select(["room_uuid", "whiteboard_room_uuid", "creator_user_uuid", "room_status"])
            .where(
                `cyclical_uuid = :cyclicalUUID
                AND room_status IN (:...roomStatus)
                AND is_delete = false`,
                {
                    cyclicalUUID,
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

        if (roomInfo.creator_user_uuid === userUUID) {
            if (roomInfo.room_status === RoomStatus.Pending) {
                await updateDB(roomInfo.room_uuid, userUUID, true, cyclicalUUID);
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

/* eslint-disable @typescript-eslint/indent */
type JoinCyclicalBody = {
    cyclicalUUID: string;
};
/* eslint-enable @typescript-eslint/indent */

export const joinCyclicalSchemaType: FastifySchema<{
    body: JoinCyclicalBody;
}> = {
    body: {
        type: "object",
        required: ["cyclicalUUID"],
        properties: {
            cyclicalUUID: {
                type: "string",
                maxLength: 40,
            },
        },
    },
};