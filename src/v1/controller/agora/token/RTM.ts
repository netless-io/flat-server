import { Status } from "../../../../Constants";
import { FastifyReply } from "fastify";
import { PatchRequest } from "../../../types/Server";
import { getRTMToken } from "../../../utils/AgoraToken";

export const generateRTM = async (req: PatchRequest, reply: FastifyReply): Promise<void> => {
    const token = await getRTMToken(req.user.userUUID);

    return reply.send({
        status: Status.Success,
        data: {
            token,
        },
    });
};
