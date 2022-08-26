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
    taskUUID: Type.Optional(Type.String()),
    taskToken: Type.Optional(Type.String()),
});
// e.g: ppt / pdf
export interface WhiteboardConvertPayload extends RegionPayload, ConvertPayload {
    taskUUID?: string;
    taskToken?: string;
}

export const WhiteboardProjectorPayloadSchema = Type.Object({
    region: RegionSchema,
    convertStep: FileConvertStepSchema,
    taskUUID: Type.Optional(Type.String()),
    taskToken: Type.Optional(Type.String()),
});
// e.g: pptx
export interface WhiteboardProjectorPayload extends RegionPayload, ConvertPayload {
    taskUUID?: string;
    taskToken?: string;
}

// e.g: mp4 / mp3 / png
export interface NormalResourcesPayloadSchema {}

export interface DirectoryPayload {}

export type FilePayload =
    | WhiteboardConvertPayload
    | NormalResourcesPayloadSchema
    | WhiteboardProjectorPayload
    | DirectoryPayload;
