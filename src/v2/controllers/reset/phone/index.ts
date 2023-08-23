import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserPhoneService } from "../../../services/user/phone";
import { successJSON } from "../../internal/utils/response-json";

export const resetPhoneSchema = {
    body: Type.Object(
        {
            phone: Type.String(),
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

export const resetPhone = async (
    req: FastifyRequestTypebox<typeof resetPhoneSchema>,
): Promise<Response> => {
    const service = new UserPhoneService(req.ids, req.DBTransaction);

    await service.reset(req.body.phone, req.body.code, req.body.password);

    return successJSON({});
};
