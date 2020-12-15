import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { Agora, Status } from "../../../../Constants";
import { FastifyReply, FastifyRequest } from "fastify";
import { FastifySchema } from "../../../types/Server";

export const generateRTC = async (
    req: FastifyRequest<{
        Body: GenerateRTCBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { channelName, uid } = req.body;

    const token = RtcTokenBuilder.buildTokenWithUid(
        Agora.APP_ID,
        Agora.APP_CERTIFICATE,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        0,
    );

    return reply.send({
        status: Status.Success,
        data: {
            token,
        },
    });
};

type GenerateRTCBody = {
    channelName: string;
    uid: number;
};

export const generateRTCSchemaType: FastifySchema<{
    body: GenerateRTCBody;
}> = {
    body: {
        type: "object",
        required: ["channelName", "uid"],
        properties: {
            channelName: {
                type: "string",
            },
            uid: {
                type: "integer",
            },
        },
    },
};
