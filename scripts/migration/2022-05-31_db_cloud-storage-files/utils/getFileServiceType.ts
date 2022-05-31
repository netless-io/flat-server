import { IFindData } from "../type";

export const getFileServiceType = (
    data: IFindData,
): "WhiteboardConvert" | "LocalCourseware" | "OnlineCourseware" | "NormalResources" => {
    if (data.task_token !== "" && data.task_token !== "" && data.region !== "none") {
        return "WhiteboardConvert";
    }

    if (data.file_name.endsWith(".ice")) {
        return "LocalCourseware";
    }

    if (data.region === "none") {
        return "OnlineCourseware";
    }

    return "NormalResources";
};
