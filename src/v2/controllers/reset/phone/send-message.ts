import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserPhoneService } from "../../../services/user/phone";
import { successJSON } from "../../internal/utils/response-json";

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
