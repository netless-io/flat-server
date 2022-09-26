import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthService } from "../../../services/developer/oauth/oauth";
import { DeveloperOAuthListReturn } from "../../../services/developer/oauth/oauth.type";

export const DeveloperOAuthListSchema = {
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

export const developerOAuthList = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthListSchema>,
): Promise<Response<DeveloperOAuthListReturn>> => {
    const result = await new DeveloperOAuthService(req.ids, req.DBTransaction, req.userUUID).list(
        req.body,
    );

    return successJSON(result);
};
