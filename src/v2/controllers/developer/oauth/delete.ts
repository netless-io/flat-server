import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthService } from "../../../services/developer/oauth/oauth";
import { DeveloperOAuthInfoService } from "../../../services/developer/oauth/oauth-info";

export const DeveloperOAuthDeleteSchema = {
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

export const developerOAuthDelete = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthDeleteSchema>,
): Promise<Response> => {
    await new DeveloperOAuthInfoService(req.ids, req.DBTransaction, req.userUUID).assertIsOwner(
        req.body.oauthUUID,
    );

    const result = await new DeveloperOAuthService(req.ids, req.DBTransaction, req.userUUID).delete(
        req.body.oauthUUID,
    );

    return successJSON(result);
};
