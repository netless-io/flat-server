import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserPhoneService } from "../../../services/user/phone";
import { successJSON } from "../../internal/utils/response-json";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

export const registerPhoneSendMessageSchema = {
    body: Type.Object(
        {
            phone: Type.String(),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const registerPhoneSendMessage = async (
    req: FastifyRequestTypebox<typeof registerPhoneSendMessageSchema>,
): Promise<Response> => {
    const service = new UserPhoneService(req.ids, req.DBTransaction);

    await service.sendMessageForRegister(req.body.phone);

    return successJSON({});
};

export const registerPhoneSendMessageCaptchaSchema = {
    body: Type.Object(
        {
            phone: Type.String(),
            captchaVerifyParam: Type.String(),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const registerPhoneSendMessageCaptcha = async (
    req: FastifyRequestTypebox<typeof registerPhoneSendMessageCaptchaSchema>,
): Promise<Response> => {
    const service = new UserPhoneService(req.ids, req.DBTransaction);

    if (!req.body.captchaVerifyParam) {
        throw new FError(ErrorCode.CaptchaRequired);
    }

    await service.sendMessageForRegister(req.body.phone, req.body.captchaVerifyParam);

    return successJSON({});
};
