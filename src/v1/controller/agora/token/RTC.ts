import { Status } from "../../../../Constants";
import { FastifyReply, FastifyRequest } from "fastify";
import { FastifySchema } from "../../../types/Server";
import { getRTCToken } from "../../../utils/AgoraToken";

export const generateRTC = async (
    req: FastifyRequest<{
        Body: GenerateRTCBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { roomUUID, channelName, uid } = req.body;

    const token = await getRTCToken(roomUUID, uid, channelName);

    return reply.send({
        status: Status.Success,
        data: {
            token,
        },
    });
};

interface GenerateRTCBody {
    channelName: string;
    uid: number;
    roomUUID: string;
}

export const generateRTCSchemaType: FastifySchema<{
    body: GenerateRTCBody;
}> = {
    body: {
        type: "object",
        required: ["channelName", "uid", "roomUUID"],
        properties: {
            channelName: {
                type: "string",
            },
            uid: {
                type: "integer",
            },
            roomUUID: {
                type: "string",
            },
        },
    },
};
