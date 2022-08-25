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
        whiteboardConvertPayload: Type.Optional(WhiteboardConvertPayloadSchema),
        whiteboardProjectorPayload: Type.Optional(WhiteboardProjectorPayloadSchema),
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
