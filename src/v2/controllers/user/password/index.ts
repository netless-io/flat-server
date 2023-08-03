import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { UserUpdateService } from "../../../services/user/update";

export const userPasswordSchema = {
    body: Type.Object(
        {
            password: Type.Optional(
                Type.String({
                    format: "password",
                    minLength: 8,
                    maxLength: 32,
                }),
            ),
            newPassword: Type.String({
                format: "password",
                minLength: 8,
                maxLength: 32,
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const userPassword = async (
    req: FastifyRequestTypebox<typeof userPasswordSchema>,
): Promise<Response> => {
    const service = new UserUpdateService(req.ids, req.DBTransaction, req.userUUID);

    await service.password(req.body.password || null, req.body.newPassword);

    return successJSON({});
};
