import { Region } from "../../constants/Project";
import { FileConvertStep } from "./Constants";

interface CloudStorageBasicPayload {
    region: Region;
}

interface Convert {
    convertStep: FileConvertStep;
}

export interface WhiteboardConvertPayload extends CloudStorageBasicPayload, Convert {
    taskUUID: string;
    taskToken: string;
}

export interface LocalCoursewarePayload extends CloudStorageBasicPayload, Convert {}

export interface OnlineCoursewarePayload {
    // ...
}

export type FilePayload =
    | WhiteboardConvertPayload
    | LocalCoursewarePayload
    | OnlineCoursewarePayload;
