import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { DeveloperOAuthInfoService } from "../../../services/developer/oauth/oauth-info";
import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";
import { useOnceService } from "../../../service-locator";

export const DeveloperOAuthUpdateSchema = {
    body: Type.Object(
        {
            oauthUUID: Type.String({
                format: "uuid-v4",
            }),
            appName: Type.Optional(
                Type.String({
                    minLength: 1,
                    maxLength: 30,
                }),
            ),
            appDesc: Type.Optional(
                Type.String({
                    minLength: 1,
                    maxLength: 300,
                }),
            ),
            homepageURL: Type.Optional(
                Type.String({
                    minLength: 1,
                    maxLength: 100,
                    format: "https",
                }),
            ),
            callbacksURL: Type.Optional(
                Type.Array(
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
            ),
            scopes: Type.Optional(
                Type.Array(
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
            ),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const developerOAuthUpdate = async (
    req: FastifyRequestTypebox<typeof DeveloperOAuthUpdateSchema>,
): Promise<Response> => {
    const complianceText = useOnceService("complianceText", req.ids);
    await complianceText.assertTextNormal([req.body.appName, req.body.appDesc].join(" "));

    const developerOAuthInfoSVC = new DeveloperOAuthInfoService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );
    await developerOAuthInfoSVC.assertIsOwner(req.body.oauthUUID);

    const scopes = Array.from(new Set(req.body.scopes)) as DeveloperOAuthScope[];

    await developerOAuthInfoSVC.update({
        oauthUUID: req.body.oauthUUID,
        appName: req.body.appName,
        appDesc: req.body.appDesc,
        homepageURL: req.body.homepageURL,
        scopes,
        callbacksURL: req.body.callbacksURL,
    });

    return successJSON({});
};
