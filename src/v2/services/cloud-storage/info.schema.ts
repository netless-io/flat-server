import { Type } from "@sinclair/typebox";
import { FileResourceType } from "../../../model/cloudStorage/Constants";
import {
    WhiteboardConvertPayloadSchema,
    WhiteboardProjectorPayloadSchema,
} from "../../../model/cloudStorage/Types";

export const listSchema = Type.Array(
    Type.Object({
        fileUUID: Type.String(),
        createAt: Type.Integer(),
        fileName: Type.String(),
        fileURL: Type.String(),
        fileSize: Type.Integer(),
        resourceType: Type.String({
            enum: [
                FileResourceType.WhiteboardConvert,
                FileResourceType.WhiteboardProjector,
                FileResourceType.NormalResources,
                FileResourceType.Directory,
            ],
        }),
        meta: Type.Object({
            whiteboardConvert: Type.Optional(WhiteboardConvertPayloadSchema),
            whiteboardProjector: Type.Optional(WhiteboardProjectorPayloadSchema),
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
        canCreateDirectory: Type.Boolean(),
    },
    {
        additionalProperties: false,
    },
);
