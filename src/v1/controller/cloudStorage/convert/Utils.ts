import { FileConvertStep } from "../Constants";

export function determineType(resource: string): "static" | "dynamic" {
    return resource.endsWith(".pptx") ? "dynamic" : "static";
}

export function isConverting(convertStep: FileConvertStep): boolean {
    return convertStep === FileConvertStep.Converting;
}

export function isConvertDone(convertStep: FileConvertStep): boolean {
    return convertStep === FileConvertStep.Done;
}

export function isConvertFailed(convertStep: FileConvertStep): boolean {
    return convertStep === FileConvertStep.Failed;
}
