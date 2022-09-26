import { Type } from "@sinclair/typebox";
import { developerOAuthInfoInfoReturnSchema } from "./oauth-info.schema";

export const developerOAuthInfoReturnSchema = Type.Object({
    ...developerOAuthInfoInfoReturnSchema.properties,
    userCount: Type.Number(),
    secrets: Type.Array(
        Type.Object({
            secretUUID: Type.String({
                format: "uuid-v4",
            }),
            clientSecret: Type.String({
                minLength: 6 + 8,
            }),
            createdAt: Type.Number(),
        }),
    ),
});
