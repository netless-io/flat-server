import { Next, Request, Response } from "restify";
import { RtmRole, RtmTokenBuilder } from "agora-access-token";
import { Agora, Status } from "../../../../Constants";

export const generateRTM = async (req: Request, res: Response, next: Next): Promise<void> => {
    const { uid } = req.body as GenerateRTMBody;

    const token = RtmTokenBuilder.buildToken(
        Agora.APP_ID,
        Agora.APP_CERTIFICATE,
        uid,
        RtmRole.Rtm_User,
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

export const generateRTMValidationRules = {
    body: {
        type: "object",
        properties: {
            uid: {
                type: "string",
            },
        },
    },
};

type GenerateRTMBody = {
    uid: number;
};
