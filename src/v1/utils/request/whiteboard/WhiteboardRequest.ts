import { ax } from "../../Axios";
import { createWhiteboardSDKToken } from "../../../../utils/NetlessToken";
import { AxiosResponse } from "axios";
import { Region } from "../../../../constants/Project";

/**
 * whiteboard create room api
 * @param {Region} region - whiteboard room region
 * @param {number} limit - (default: 0 = no limit)
 * @return {string} whiteboard room uuid, not room model's room_uuid
 */
export const whiteboardCreateRoom = async (region: Region, limit = 0): Promise<string> => {
    const {
        data: { uuid },
    } = await ax.post<Room>(
        "https://api.netless.link/v5/rooms",
        {
            isRecord: true,
            limit,
        },
        {
            headers: {
                token: createWhiteboardSDKToken(),
                region,
            },
        },
    );

    return uuid;
};

export const whiteboardBanRoom = async (
    region: Region,
    uuid: string,
): Promise<AxiosResponse<Room>> => {
    return await ax.patch<Room>(
        `https://api.netless.link/v5/rooms/${uuid}`,
        {
            isBan: true,
        },
        {
            headers: {
                token: createWhiteboardSDKToken(),
                region,
            },
        },
    );
};

export const whiteboardCreateConversionTaskByStatic = async (
    region: Region,
    body: CreateStaticConversionTaskParams,
): Promise<AxiosResponse<StaticTaskCreated>> => {
    return await ax.post<StaticTaskCreated>(
        "https://api.netless.link/v5/services/conversion/tasks",
        {
            ...body,
            pack: true,
            type: "static",
        },
        {
            headers: {
                token: createWhiteboardSDKToken(),
                region,
            },
        },
    );
};

interface CreateStaticConversionTaskParams {
    resource: string;
    scale: number;
}

export interface StaticTaskCreated {
    uuid: string;
    type: "static" | "dynamic";
    status: "Waiting" | "Converting" | "Finished" | "Fail";
}

export const whiteboardCreateConversionTaskByDynamic = async (
    region: Region,
    resource: string,
): Promise<AxiosResponse<DynamicTaskCreated>> => {
    return await ax.post<DynamicTaskCreated>(
        "https://api.netless.link/v5/projector/tasks",
        {
            resource,
            pack: false,
            preview: true,
        },
        {
            headers: {
                token: createWhiteboardSDKToken(),
                region,
            },
        },
    );
};

export interface DynamicTaskCreated {
    uuid: string;
    status: "Waiting" | "Converting" | "Finished" | "Fail" | "Abort";
}

export const whiteboardQueryConversionTaskByStatic = async (
    region: Region,
    uuid: string,
): Promise<AxiosResponse<StaticTaskStatus>> => {
    return await ax.get<StaticTaskStatus>(
        `https://api.netless.link/v5/services/conversion/tasks/${uuid}?type=static`,
        {
            headers: {
                token: createWhiteboardSDKToken(),
                region,
            },
        },
    );
};

interface StaticTaskStatus {
    uuid: string;
    type: "static" | "dynamic";
    status: "Waiting" | "Converting" | "Finished" | "Fail";
    failedReason: string;
    progress: {
        totalPageSize: number;
        convertedPageSize: number;
        convertedPercentage: number;
        convertedFileList: {
            width: number;
            height: number;
            conversionFileUrl: string;
            preview?: string;
        }[];
        currentStep: "Extracting" | "Packaging" | "GeneratingPreview" | "MediaTranscode";
    };
}

export const whiteboardQueryConversionTaskByDynamic = async (
    region: Region,
    uuid: string,
): Promise<AxiosResponse<DynamicTaskStatus>> => {
    return await ax.get<DynamicTaskStatus>(`https://api.netless.link/v5/projector/tasks/${uuid}`, {
        headers: {
            token: createWhiteboardSDKToken(),
            region,
        },
    });
};

interface DynamicTaskStatus {
    uuid: string;
    type: "static" | "dynamic";
    status: "Waiting" | "Converting" | "Finished" | "Fail" | "Abort";
    errorCode?: string;
    errorMessage?: string;
    convertedPercentage?: number;
    prefix?: string;
}

interface Room {
    uuid: string;
    name: string;
    teamUUID: string;
    isRecord: boolean;
    isBan: boolean;
    limit: number;
    createdAt: string;
}
