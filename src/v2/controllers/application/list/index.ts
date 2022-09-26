import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthService } from "../../../services/developer/oauth/oauth";
import { DeveloperOAuthListByUserReturn } from "../../../services/developer/oauth/oauth.type";

export const ApplicationListSchema = {
    body: Type.Object(
        {
            page: Type.Number({
                minimum: 1,
                maximum: 50,
            }),
            size: Type.Number({
                default: 50,
                minimum: 1,
                maximum: 50,
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const applicationList = async (
    req: FastifyRequestTypebox<typeof ApplicationListSchema>,
): Promise<Response<DeveloperOAuthListByUserReturn>> => {
    const result = await new DeveloperOAuthService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    ).listByUser(req.body);

    return successJSON(result);
};
