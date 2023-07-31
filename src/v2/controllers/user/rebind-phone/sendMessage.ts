import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserRebindPhoneService } from "../../../services/user/rebind-phone";
import { successJSON } from "../../internal/utils/response-json";

export const userRebindPhoneSendMessageSchema = {
    body: Type.Object(
        {
            phone: Type.String(),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const userRebindPhoneSendMessage = async (
    req: FastifyRequestTypebox<typeof userRebindPhoneSendMessageSchema>,
): Promise<Response> => {
    const service = new UserRebindPhoneService(req.ids, req.DBTransaction, req.userUUID);

    await service.sendMessage(req.body.phone);

    return successJSON({});
};
