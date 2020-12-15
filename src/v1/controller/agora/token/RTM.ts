import { RtmRole, RtmTokenBuilder } from "agora-access-token";
import { Agora, Status } from "../../../../Constants";
import { FastifyReply, FastifyRequest } from "fastify";
import { FastifySchema } from "../../../types/Server";

export const generateRTM = async (
    req: FastifyRequest<{
        Body: GenerateRTMBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { uid } = req.body;

    const token = RtmTokenBuilder.buildToken(
        Agora.APP_ID,
        Agora.APP_CERTIFICATE,
        uid,
        RtmRole.Rtm_User,
        0,
    );

    reply.send({
        status: Status.Success,
        data: {
            token,
        },
    });
};

type GenerateRTMBody = {
    uid: string;
};

export const generateRTMSchemaType: FastifySchema<{
    body: GenerateRTMBody;
}> = {
    body: {
        type: "object",
        required: ["uid"],
        properties: {
            uid: {
                type: "string",
            },
        },
    },
};
