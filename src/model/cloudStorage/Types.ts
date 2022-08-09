import { Region, RegionSchema } from "../../constants/Project";
import { FileConvertStep, FileConvertStepSchema } from "./Constants";
import { Type } from "@sinclair/typebox";

interface RegionPayload {
    region: Region;
}

interface ConvertPayload {
    convertStep: FileConvertStep;
}

export const WhiteboardConvertPayloadSchema = Type.Object({
    region: RegionSchema,
    convertStep: FileConvertStepSchema,
    taskUUID: Type.String(),
    taskToken: Type.String(),
});
// e.g: ppt / pdf
export interface WhiteboardConvertPayload extends RegionPayload, ConvertPayload {
    taskUUID: string;
    taskToken: string;
}

export const WhiteboardProjectorPayloadSchema = Type.Object({
    region: RegionSchema,
    convertStep: FileConvertStepSchema,
    taskUUID: Type.String(),
    taskToken: Type.String(),
});
// e.g: pptx
export interface WhiteboardProjectorPayload extends RegionPayload, ConvertPayload {
    taskUUID: string;
    taskToken: string;
}

export const LocalCoursewarePayloadSchema = Type.Object({
    convertStep: FileConvertStepSchema,
});
// e.g: ice
export interface LocalCoursewarePayload extends ConvertPayload {}

export const OnlineCoursewarePayloadSchema = Type.Object({});
// e.g: vf
export interface OnlineCoursewarePayload {}

export const ResourcesPayloadSchema = Type.Object({});
// e.g: mp4 / mp3 / png
export interface ResourcesPayload {}

export const DirectoryPayloadSchema = Type.Object({});
export interface DirectoryPayload {}

export const FilePayloadSchema = Type.Union([
    WhiteboardConvertPayloadSchema,
    LocalCoursewarePayloadSchema,
    OnlineCoursewarePayloadSchema,
    ResourcesPayloadSchema,
    WhiteboardProjectorPayloadSchema,
    DirectoryPayloadSchema,
]);
export type FilePayload =
    | WhiteboardConvertPayload
    | LocalCoursewarePayload
    | OnlineCoursewarePayload
    | ResourcesPayload
    | WhiteboardProjectorPayload
    | DirectoryPayload;
