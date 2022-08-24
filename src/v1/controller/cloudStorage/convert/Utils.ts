import { FileConvertStep } from "../../../../model/cloudStorage/Constants";

export const determineType = (resource: string): "static" | "dynamic" => {
    return resource.endsWith(".pptx") ? "dynamic" : "static";
};

export const isWhiteboardCourseware = (resource: string): boolean => {
    return (
        resource.endsWith(".ppt") ||
        resource.endsWith(".pptx") ||
        resource.endsWith(".pdf") ||
        resource.endsWith(".doc") ||
        resource.endsWith(".docx")
    );
};

export const isConverting = (convertStep: FileConvertStep): boolean => {
    return convertStep === FileConvertStep.Converting;
};

export const isConvertDone = (convertStep: FileConvertStep): boolean => {
    return convertStep === FileConvertStep.Done;
};

export const isConvertFailed = (convertStep: FileConvertStep): boolean => {
    return convertStep === FileConvertStep.Failed;
};
