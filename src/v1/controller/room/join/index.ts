import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { joinOrdinary } from "./Ordinary";
import { joinPeriodic } from "./Periodic";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { Result } from "./Type";

export const join = async (
    req: PatchRequest<{
        Body: JoinBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const uuidIsPeriodicUUID = await getRepository(RoomPeriodicConfigModel).findOne({
            select: ["id"],
            where: {
                periodic_uuid: roomUUID,
            },
        });

        let result: Result;
        if (uuidIsPeriodicUUID) {
            result = await joinPeriodic(roomUUID, userUUID);
        } else {
            result = await joinOrdinary(roomUUID, userUUID);
        }

        return reply.send(result);
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "Join room failed",
        });
    }
};

interface JoinBody {
    roomUUID: string;
}

export const joinSchemaType: FastifySchema<{
    body: JoinBody;
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
