import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomCyclicalConfigModel } from "../../../model/room/RoomCyclicalConfig";
import { insertUserToRoomUserDB } from "./Utils";

export const joinCyclical = async (
    req: PatchRequest<{
        Body: JoinCyclicalBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { cyclicalUUID } = req.body;
    const { userUUID } = req.user;

    try {
        // determine if it exists
        const roomCyclicalConfig = await getRepository(RoomCyclicalConfigModel).find({
            select: ["id"],
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

        const roomInfo = await getRepository(RoomModel)
            .createQueryBuilder()
            .where(
                `cyclical_uuid = :cyclicalUUID
                AND room_status IN (:...roomStatus)
                AND is_delete = false`,
                {
                    cyclicalUUID,
                    roomStatus: [RoomStatus.Pending, RoomStatus.Running],
                },
            )
            .getOne();

        // notify user to retry
        if (roomInfo === undefined) {
            return reply.send({
                status: Status.Failed,
                message: "Room has ended or been deleted",
            });
        }

        await insertUserToRoomUserDB(roomInfo.room_uuid, userUUID);

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
