import { Type } from "@sinclair/typebox";
import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { useOnceService } from "../../../service-locator";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthService } from "../../../services/developer/oauth/oauth";

export const DeveloperOAuthCreateSchema = {
    body: Type.Object(
        {
            appName: Type.String({
                minLength: 1,
                maxLength: 30,
            }),
            appDesc: Type.String({
                minLength: 1,
                maxLength: 300,
            }),
            homepageURL: Type.String({
                minLength: 1,
                maxLength: 100,
                format: "https",
            }),
            callbacksURL: Type.Array(
                Type.String({
                    minLength: 1,
                    maxLength: 400,
                    format: "https",
                }),
                {
                    minItems: 1,
                    maxItems: 5,
                },
            ),
            scopes: Type.Array(
                Type.String({
                    enum: [
                        DeveloperOAuthScope.UserUUIDRead,
                        DeveloperOAuthScope.UserNameRead,
                        DeveloperOAuthScope.UserAvatarRead,
                    ],
                }),
                {
                    minItems: 1,
                    maxItems: [
                        DeveloperOAuthScope.UserUUIDRead,
                        DeveloperOAuthScope.UserNameRead,
                        DeveloperOAuthScope.UserAvatarRead,
                    ].length,
                },
            ),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const developerOAuthCreate = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthCreateSchema>,
): Promise<Response> => {
    const complianceText = useOnceService("complianceText", req.ids);
    await complianceText.assertTextNormal([req.body.appName, req.body.appDesc].join(" "));

    const scopes = Array.from(new Set(req.body.scopes)) as DeveloperOAuthScope[];

    const oauthUUID = await new DeveloperOAuthService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    ).create({
        appName: req.body.appName,
        appDesc: req.body.appDesc,
        homepageURL: req.body.homepageURL,
        callbacksURL: req.body.callbacksURL,
        scopes,
    });

    return successJSON({
        oauthUUID,
    });
};
