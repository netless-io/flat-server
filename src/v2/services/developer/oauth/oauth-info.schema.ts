import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";
import { Type } from "@sinclair/typebox";

export const developerOAuthInfoInfoReturnSchema = Type.Object({
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
    logoURL: Type.String({
        minLength: 1,
        maxLength: 300,
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
});
