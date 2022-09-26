import { Type } from "@sinclair/typebox";

export const DeveloperOAuthLogoStartReturnSchema = Type.Object(
    {
        fileUUID: Type.String(),
        ossDomain: Type.String(),
        ossFilePath: Type.String(),
        policy: Type.String(),
        signature: Type.String(),
    },
    {
        additionalProperties: false,
    },
);
