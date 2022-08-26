import { Type } from "@sinclair/typebox";

export enum FileConvertStep {
    None = "None",
    Converting = "Converting",
    Done = "Done",
    Failed = "Failed",
}
export const FileConvertStepSchema = Type.String({
    enum: [
        FileConvertStep.Converting,
        FileConvertStep.Done,
        FileConvertStep.Failed,
        FileConvertStep.None,
    ],
});

export enum FileResourceType {
    WhiteboardConvert = "WhiteboardConvert",
    WhiteboardProjector = "WhiteboardProjector",
    NormalResources = "NormalResources",
    Directory = "Directory",
}

export const ossResourceType = [
    FileResourceType.WhiteboardProjector,
    FileResourceType.WhiteboardConvert,
    FileResourceType.NormalResources,
];

export const whiteboardResourceType = [
    FileResourceType.WhiteboardProjector,
    FileResourceType.WhiteboardConvert,
];

export const supportConvertResourceType = [
    FileResourceType.WhiteboardProjector,
    FileResourceType.WhiteboardConvert,
];
