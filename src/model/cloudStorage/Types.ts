import { Region, RegionSchema } from "../../constants/Project";
import { FileConvertStep, FileConvertStepSchema } from "./Constants";
import { Type } from "@sinclair/typebox";

interface CloudStorageBasicPayload {
    region: Region;
}

interface Convert {
    convertStep: FileConvertStep;
}

export const WhiteboardConvertPayloadSchema = Type.Object({
    region: RegionSchema,
    convertStep: FileConvertStepSchema,
    taskUUID: Type.String(),
    taskToken: Type.String(),
});
// e.g: pptx / ppt / pdf
export interface WhiteboardConvertPayload extends CloudStorageBasicPayload, Convert {
    taskUUID: string;
    taskToken: string;
}

export const LocalCoursewarePayloadSchema = Type.Object({
    region: RegionSchema,
    convertStep: FileConvertStepSchema,
});
// e.g: ice
export interface LocalCoursewarePayload extends CloudStorageBasicPayload, Convert {}

export const OnlineCoursewarePayloadSchema = Type.Object({});
// e.g: vf
export interface OnlineCoursewarePayload {}

export const ResourcesPayloadSchema = Type.Object({
    region: RegionSchema,
});
// e.g: mp4 / mp3 / png
export interface ResourcesPayload extends CloudStorageBasicPayload {}

export const WhiteboardProjectorPayloadSchema = Type.Object({
    region: RegionSchema,
    convertStep: FileConvertStepSchema,
    taskUUID: Type.String(),
    taskToken: Type.String(),
});
export interface WhiteboardProjectorPayload extends CloudStorageBasicPayload, Convert {
    taskUUID: string;
    taskToken: string;
}

export const FilePayloadSchema = Type.Union([
    WhiteboardConvertPayloadSchema,
    LocalCoursewarePayloadSchema,
    OnlineCoursewarePayloadSchema,
    ResourcesPayloadSchema,
    WhiteboardProjectorPayloadSchema,
]);
export type FilePayload =
    | WhiteboardConvertPayload
    | LocalCoursewarePayload
    | OnlineCoursewarePayload
    | ResourcesPayload
    | WhiteboardProjectorPayload;
