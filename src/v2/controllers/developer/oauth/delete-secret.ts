import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthSecretService } from "../../../services/developer/oauth/oauth-secret";

export const DeveloperOAuthDeleteSecretSchema = {
    body: Type.Object(
        {
            secretUUID: Type.String({
                format: "uuid-v4",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const developerOAuthDeleteSecret = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthDeleteSecretSchema>,
): Promise<Response> => {
    const developerOAuthSecretSVC = new DeveloperOAuthSecretService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );
    await developerOAuthSecretSVC.assertIsOwner(req.body.secretUUID);

    await developerOAuthSecretSVC.delete(req.body.secretUUID);

    return successJSON({});
};
