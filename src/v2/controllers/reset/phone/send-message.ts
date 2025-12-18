import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserPhoneService } from "../../../services/user/phone";
import { successJSON } from "../../internal/utils/response-json";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

export const resetPhoneSendMessageSchema = {
    body: Type.Object(
        {
            phone: Type.String(),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const resetPhoneSendMessage = async (
    req: FastifyRequestTypebox<typeof resetPhoneSendMessageSchema>,
): Promise<Response> => {
    const service = new UserPhoneService(req.ids, req.DBTransaction);

    await service.sendMessageForReset(req.body.phone);

    return successJSON({});
};

export const resetPhoneSendMessageCaptchaSchema = {
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

export const resetPhoneSendMessageCaptcha = async (
    req: FastifyRequestTypebox<typeof resetPhoneSendMessageCaptchaSchema>,
): Promise<Response> => {
    const service = new UserPhoneService(req.ids, req.DBTransaction);

    if (!req.body.captchaVerifyParam) {
        throw new FError(ErrorCode.CaptchaRequired);
    }

    await service.sendMessageForReset(req.body.phone, req.body.captchaVerifyParam);

    return successJSON({});
};
