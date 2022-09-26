import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthInfoService } from "../../../services/developer/oauth/oauth-info";
import { DeveloperOAuthSecretService } from "../../../services/developer/oauth/oauth-secret";
import { DeveloperOAuthSecretCreateReturn } from "../../../services/developer/oauth/oauth-secret.type";

export const DeveloperOAuthCreateSecretSchema = {
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

export const developerOAuthCreateSecret = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthCreateSecretSchema>,
): Promise<Response<DeveloperOAuthSecretCreateReturn>> => {
    await new DeveloperOAuthInfoService(req.ids, req.DBTransaction, req.userUUID).assertIsOwner(
        req.body.oauthUUID,
    );

    const result = await new DeveloperOAuthSecretService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    ).create(req.body.oauthUUID);

    return successJSON(result);
};
