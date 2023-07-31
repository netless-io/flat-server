import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserPhoneService } from "../../../services/user/phone";
import { successJSON } from "../../internal/utils/response-json";

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
