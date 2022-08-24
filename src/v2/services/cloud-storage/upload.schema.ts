import { Type } from "@sinclair/typebox";
import { FileResourceType } from "../../../model/cloudStorage/Constants";

export const uploadStartReturnSchema = Type.Object(
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

export const GetFileInfoByRedisReturnSchema = Type.Object({
    fileName: Type.String(),
    fileSize: Type.Integer(),
    targetDirectoryPath: Type.String(),
    fileResourceType: Type.String({
        enum: [
            FileResourceType.NormalResources,
            FileResourceType.WhiteboardProjector,
            FileResourceType.WhiteboardConvert,
        ],
    }),
});
