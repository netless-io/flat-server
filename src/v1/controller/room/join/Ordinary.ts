import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { updateDB } from "./Utils";

export const joinOrdinary = async (
    req: PatchRequest<{
        Body: JoinOrdinaryBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const roomUUID = req.body.roomUUID;
    const { userUUID } = req.user;

    try {
        const roomInfo = await getRepository(RoomModel).findOne({
            select: ["room_status", "whiteboard_room_uuid", "owner_user_uuid"],
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

        if (roomInfo.room_status === RoomStatus.Stopped) {
            return reply.send({
                status: Status.Failed,
                message: "Room has been ended",
            });
        }

        if (roomInfo.owner_user_uuid === userUUID) {
            if (roomInfo.room_status === RoomStatus.Pending) {
                await updateDB(roomUUID, userUUID, true);
            }
        } else {
            await updateDB(roomUUID, userUUID);
        }

        return reply.send({
            status: Status.Success,
            data: {
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

interface JoinOrdinaryBody {
    roomUUID: string;
}

export const joinOrdinarySchemaType: FastifySchema<{
    body: JoinOrdinaryBody;
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
