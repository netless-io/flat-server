import { ax } from "../../Axios";
import { shuntConversionTaskURL, shuntCreateRoomURL } from "./WhiteboardURL";
import { createWhiteboardSDKToken } from "../../../../utils/NetlessToken";
import { AxiosResponse } from "axios";

/**
 * whiteboard create room api
 * @param {number} limit - (default: 0 = no limit)
 * @return {string} whiteboard room uuid, not room model's room_uuid
 */
export const whiteboardCreateRoom = async (limit = 0): Promise<string> => {
    const {
        data: { uuid },
    } = await ax.post<Room>(
        shuntCreateRoomURL,
        {
            isRecord: true,
            limit,
        },
        {
            headers: {
                token: createWhiteboardSDKToken(),
                // TODO region: 'cn-hz',
            },
        },
    );

    return uuid;
};

export const whiteboardBanRoom = async (uuid: string): Promise<AxiosResponse<Room>> => {
    return await ax.patch<Room>(
        `${shuntCreateRoomURL}/${uuid}`,
        {
            isBan: true,
        },
        {
            headers: {
                token: createWhiteboardSDKToken(),
                // TODO region: 'cn-hz',
            },
        },
    );
};

export const whiteboardCreateConversionTask = async (
    body: CreateConversionTaskParams,
): Promise<AxiosResponse<TaskCreated>> => {
    return await ax.post<TaskCreated>(shuntConversionTaskURL, body, {
        headers: {
            token: createWhiteboardSDKToken(),
            // TODO region: 'cn-hz',
        },
    });
};

export const whiteboardQueryConversionTask = async (
    uuid: string,
    type: "static" | "dynamic",
): Promise<AxiosResponse<TaskStatus>> => {
    return await ax.get<TaskStatus>(`${shuntConversionTaskURL}/${uuid}?type=${type}`, {
        headers: {
            token: createWhiteboardSDKToken(),
            // TODO region: 'cn-hz',
        },
    });
};

type CreateConversionTaskParams =
    | CreateStaticConversionTaskParams
    | CreateDynamicConversionTaskParams;

interface CreateStaticConversionTaskParams {
    resource: string;
    type: "static";
    /** @default 1.2 */
    scale?: number;
    /** @default 'png' */
    outputFormat?: "png" | "jpg" | "jpeg" | "webp";
    pack?: boolean;
}

interface CreateDynamicConversionTaskParams {
    resource: string;
    type: "dynamic";
    /** @default false */
    preview?: boolean;
}

interface TaskCreated {
    uuid: string;
    type: "static" | "dynamic";
    status: "Waiting" | "Converting" | "Finished" | "Fail";
}

interface TaskStatus {
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

interface Room {
    uuid: string;
    name: string;
    teamUUID: string;
    isRecord: boolean;
    isBan: boolean;
    limit: number;
    createdAt: string;
}
