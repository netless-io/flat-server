import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthInfoService } from "../../../services/developer/oauth/oauth-info";
import { DeveloperOAuthInfoDetailReturn } from "../../../services/developer/oauth/oauth-info.type";

export const ApplicationDetailSchema = {
    body: Type.Object(
        {
            oauthUUID: Type.String({
                format: "uuid-v4",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const applicationDetail = async (
    req: FastifyRequestTypebox<typeof ApplicationDetailSchema>,
): Promise<Response<DeveloperOAuthInfoDetailReturn>> => {
    const result = await new DeveloperOAuthInfoService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    ).detail(req.body.oauthUUID);

    return successJSON(result);
};
