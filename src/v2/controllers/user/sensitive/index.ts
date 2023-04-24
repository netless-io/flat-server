import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserSensitiveListReturn, UserSensitiveService } from "../../../services/user/sensitive";
import { successJSON } from "../../internal/utils/response-json";

export const userSensitiveSchema = {
    body: Type.Object(
        {
            from: Type.Integer(),
            to: Type.Integer(),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const userSensitive = async (
    req: FastifyRequestTypebox<typeof userSensitiveSchema>,
): Promise<Response<UserSensitiveListReturn[]>> => {
    const result = await new UserSensitiveService(req.ids, req.DBTransaction, req.userUUID).list({
        from: new Date(req.body.from),
        to: new Date(req.body.to),
    });

    return successJSON(result);
};
