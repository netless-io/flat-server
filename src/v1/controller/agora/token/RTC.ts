import { Next, Request, Response } from "restify";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { Agora, Status } from "../../../../Constants";

export const generateRTC = async (req: Request, res: Response, next: Next): Promise<void> => {
    const { channelName, uid } = req.body as GenerateRTCBody;

    const token = RtcTokenBuilder.buildTokenWithUid(
        Agora.APP_ID,
        Agora.APP_CERTIFICATE,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        0,
    );

    res.send({
        status: Status.Success,
        data: {
            token,
        },
    });
    next();
};

export const generateRTCValidationRules = {
    body: {
        type: "object",
        properties: {
            channelName: {
                type: "string",
            },
            uid: {
                type: "string",
            },
        },
    },
};

type GenerateRTCBody = {
    channelName: string;
    uid: number;
};
