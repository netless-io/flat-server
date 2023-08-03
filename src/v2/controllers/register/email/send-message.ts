import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserEmailService } from "../../../services/user/email";
import { successJSON } from "../../internal/utils/response-json";

export const registerEmailSendMessageSchema = {
    body: Type.Object(
        {
            email: Type.String({
                format: "email",
            }),
            language: Type.Optional(Type.String()),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const registerEmailSendMessage = async (
    req: FastifyRequestTypebox<typeof registerEmailSendMessageSchema>,
): Promise<Response> => {
    const service = new UserEmailService(req.ids, req.DBTransaction);

    await service.sendMessageForRegister(req.body.email, req.body.language);

    return successJSON({});
};
