import { Type } from "@sinclair/typebox";
import { FileResourceType } from "../../../model/cloudStorage/Constants";
import { FilePayloadSchema } from "../../../model/cloudStorage/Types";

export const listSchema = Type.Array(
    Type.Object({
        fileUUID: Type.String(),
        createAt: Type.Integer(),
        fileName: Type.String(),
        payload: FilePayloadSchema,
        fileURL: Type.String(),
        fileSize: Type.Integer(),
        resourceType: Type.String({
            enum: [
                FileResourceType.OnlineCourseware,
                FileResourceType.LocalCourseware,
                FileResourceType.NormalResources,
                FileResourceType.WhiteboardConvert,
                FileResourceType.WhiteboardProjector,
                FileResourceType.Directory,
            ],
        }),
    }),
    {
        additionalProperties: false,
    },
);

export const listFilesAndTotalUsageByUserUUIDSchema = Type.Object(
    {
        totalUsage: Type.Integer(),
        items: listSchema,
        canCreateDirectory: Type.Boolean(),
    },
    {
        additionalProperties: false,
    },
);

export const findFileUUIDsSchema = Type.Array(
    Type.Object({
        fileUUID: Type.String({
            format: "uuid-v4",
        }),
        directoryPath: Type.String(),
    }),
    {
        minItems: 0,
    },
);
