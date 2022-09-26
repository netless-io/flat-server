import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthService } from "../../../services/developer/oauth/oauth";
import { DeveloperOAuthInfoReturn } from "../../../services/developer/oauth/oauth.type";
import { DeveloperOAuthInfoService } from "../../../services/developer/oauth/oauth-info";

export const DeveloperOAuthSettingDetailSchema = {
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

export const developerOAuthSettingDetail = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthSettingDetailSchema>,
): Promise<Response<DeveloperOAuthInfoReturn>> => {
    await new DeveloperOAuthInfoService(req.ids, req.DBTransaction, req.userUUID).assertIsOwner(
        req.body.oauthUUID,
    );

    const result = await new DeveloperOAuthService(req.ids, req.DBTransaction, req.userUUID).info(
        req.body.oauthUUID,
    );

    return successJSON(result);
};
