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
    LocalCourseware = "LocalCourseware",
    OnlineCourseware = "OnlineCourseware",
    NormalResources = "NormalResources",
    WhiteboardProjector = "WhiteboardProjector",
    Directory = "Directory",
}

export const ossResourceType = [
    FileResourceType.NormalResources,
    FileResourceType.WhiteboardProjector,
    FileResourceType.WhiteboardConvert,
    FileResourceType.LocalCourseware,
];

export const whiteboardResourceType = [
    FileResourceType.WhiteboardProjector,
    FileResourceType.WhiteboardConvert,
];
