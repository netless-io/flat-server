import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthInfoService } from "../../../services/developer/oauth/oauth-info";
import { OAuth } from "../../../../constants/Config";
import { DeveloperOAuthLogoService } from "../../../services/developer/oauth/oauth-logo";
import { DeveloperOAuthLogoStartReturn } from "../../../services/developer/oauth/oauth-logo.type";

export const DeveloperOAuthLogoUploadStartSchema = {
    body: Type.Object(
        {
            oauthUUID: Type.String({
                format: "uuid-v4",
            }),
            fileName: Type.String({
                format: "oauth-logo-suffix",
                minLength: 1,
                maxLength: 128,
            }),
            fileSize: Type.Number({
                minimum: 1,
                maximum: OAuth.logo.size,
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const developerOAuthLogoUploadStart = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthLogoUploadStartSchema>,
): Promise<Response<DeveloperOAuthLogoStartReturn>> => {
    await new DeveloperOAuthInfoService(req.ids, req.DBTransaction, req.userUUID).assertIsOwner(
        req.body.oauthUUID,
    );

    const result = await new DeveloperOAuthLogoService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    ).start(req.body);

    return successJSON(result);
};

export const DeveloperOAuthLogoUploadFinishSchema = {
    body: Type.Object(
        {
            oauthUUID: Type.String({
                format: "uuid-v4",
            }),
            fileUUID: Type.String({
                format: "uuid-v4",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const developerOAuthLogoUploadFinish = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthLogoUploadFinishSchema>,
): Promise<Response> => {
    await new DeveloperOAuthInfoService(req.ids, req.DBTransaction, req.userUUID).assertIsOwner(
        req.body.oauthUUID,
    );

    await new DeveloperOAuthLogoService(req.ids, req.DBTransaction, req.userUUID).finish(req.body);

    return successJSON({});
};
