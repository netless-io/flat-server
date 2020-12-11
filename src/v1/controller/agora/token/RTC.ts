import { Next, Request, Response } from "restify";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { HTTPValidationRules } from "../../../types/Server";
import { Agora, Status } from "../../../../Constants";

export const generateRTC = async (req: Request, res: Response, next: Next): Promise<void> => {
    const { channelName, uid } = req.body as GenerateRTCBody;

    const token = RtcTokenBuilder.buildTokenWithUid(Agora.APP_ID, Agora.APP_CERTIFICATE, channelName, uid, RtcRole.PUBLISHER, 0);

    res.send({
        status: Status.Success,
        data: {
            token,
        }
    })
    next();
};

export const generateRTCValidationRules: HTTPValidationRules = {
    body: ["channelName", "uid"],
};

type GenerateRTCBody = {
    channelName: string;
    uid: number;
};
