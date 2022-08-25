import { IFindData, ITransformData } from "../type";

const getFileResourceType = (data: IFindData): "WhiteboardConvert" | "NormalResources" => {
    if (data.task_token !== "" && data.task_token !== "" && data.region !== "none") {
        return "WhiteboardConvert";
    }

    return "NormalResources";
};

export const transformData = (data: IFindData): ITransformData => {
    let payload = {};
    const fileResourceType = getFileResourceType(data);

    switch (fileResourceType) {
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
