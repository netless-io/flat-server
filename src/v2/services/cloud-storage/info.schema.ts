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
        files: listSchema,
    },
    {
        additionalProperties: false,
    },
);
