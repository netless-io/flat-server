import { IFindData, ITransformData } from "../type";

const getFileResourceType = (
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

export const transformData = (data: IFindData): ITransformData => {
    let payload = {};
    const fileResourceType = getFileResourceType(data);

    switch (fileResourceType) {
        case "LocalCourseware": {
            payload = {
                region: data.region,
                convertStep: data.convert_step,
            };
            break;
        }
        case "OnlineCourseware": {
            payload = {};
            break;
        }
        case "WhiteboardConvert": {
            payload = {
                region: data.region,
                convertStep: data.convert_step,
                taskUUID: data.task_uuid,
                taskToken: data.task_token,
            };
            break;
        }
        case "NormalResources": {
            payload = {
                region: data.region,
            };
            break;
        }
    }

    return {
        id: data.id,
        resourceType: fileResourceType,
        payload,
    };
};
