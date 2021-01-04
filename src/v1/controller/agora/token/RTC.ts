import { Status } from "../../../../Constants";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRTCToken } from "../../../utils/AgoraToken";
import { getRepository } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";

export const generateRTC = async (
    req: PatchRequest<{
        Body: GenerateRTCBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    const roomUserInfo = await getRepository(RoomUserModel).findOne({
        select: ["user_int_uuid"],
        where: {
            room_uuid: roomUUID,
            user_uuid: userUUID,
        },
    });

    if (roomUserInfo === undefined) {
        return reply.send({
            status: Status.Failed,
            message: "User is not in this room",
        });
    }

    const token = await getRTCToken(roomUUID, Number(roomUserInfo.user_int_uuid));

    return reply.send({
        status: Status.Success,
        data: {
            token,
        },
    });
};

interface GenerateRTCBody {
    roomUUID: string;
}

export const generateRTCSchemaType: FastifySchema<{
    body: GenerateRTCBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
            },
        },
    },
};
