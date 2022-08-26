import { Type } from "@sinclair/typebox";
import { FileResourceType } from "../../../model/cloudStorage/Constants";

export const CloudStorageConvertStartReturnSchema = Type.Union([
    Type.Object({
        resourceType: Type.String({
            enum: [FileResourceType.WhiteboardConvert],
        }),
        whiteboardConvert: Type.Object({
            taskUUID: Type.String(),
            taskToken: Type.String(),
        }),
    }),
    Type.Object({
        resourceType: Type.String({
            enum: [FileResourceType.WhiteboardProjector],
        }),
        whiteboardProjector: Type.Object({
            taskUUID: Type.String(),
            taskToken: Type.String(),
        }),
    }),
]);
