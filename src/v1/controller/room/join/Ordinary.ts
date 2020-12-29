import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { createQueryBuilder, getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";

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
            select: ["room_status", "whiteboard_room_uuid", "owner_uuid"],
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

        await createQueryBuilder()
            .insert()
            .into(RoomUserModel)
            .orIgnore()
            .values({
                room_uuid: roomUUID,
                user_uuid: userUUID,
                user_int_uuid: cryptoRandomString({ length: 10, type: "numeric" }),
            })
            .execute();

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
