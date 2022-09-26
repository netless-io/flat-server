import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthUserService } from "../../../services/developer/oauth/oauth-user";

export const ApplicationRevokeSchema = {
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

export const applicationRevoke = async (
    req: FastifyRequestTypebox<typeof ApplicationRevokeSchema>,
): Promise<Response> => {
    await new DeveloperOAuthUserService(req.ids, req.DBTransaction, req.userUUID).revoke(
        req.body.oauthUUID,
    );

    return successJSON({});
};
