import { Region } from "../../constants/Project";
import { FileConvertStep } from "./Constants";

interface CloudStorageBasicPayload {
    region: Region;
}

interface Convert {
    convertStep: FileConvertStep;
}

// e.g: pptx / ppt / pdf
export interface WhiteboardConvertPayload extends CloudStorageBasicPayload, Convert {
    taskUUID: string;
    taskToken: string;
}

// e.g: ice
export interface LocalCoursewarePayload extends CloudStorageBasicPayload, Convert {}

// e.g: vf
export interface OnlineCoursewarePayload {}

// e.g: mp4 / mp3 / png
export interface ResourcesPayload extends CloudStorageBasicPayload {}

export type FilePayload =
    | WhiteboardConvertPayload
    | LocalCoursewarePayload
    | OnlineCoursewarePayload
    | ResourcesPayload;
