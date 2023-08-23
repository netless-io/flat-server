import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserEmailService } from "../../../services/user/email";
import { successJSON } from "../../internal/utils/response-json";

export const resetEmailSchema = {
    body: Type.Object(
        {
            email: Type.String({
                format: "email",
            }),
            code: Type.Integer(),
            password: Type.String({
                format: "user-password",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const resetEmail = async (
    req: FastifyRequestTypebox<typeof resetEmailSchema>,
): Promise<Response> => {
    const service = new UserEmailService(req.ids, req.DBTransaction);

    await service.reset(req.body.email, req.body.code, req.body.password);

    return successJSON({});
};
