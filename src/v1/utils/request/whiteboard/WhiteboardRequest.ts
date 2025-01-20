import { ax } from "../../Axios";
import { createWhiteboardSDKToken } from "../../../../utils/NetlessToken";
import { AxiosResponse } from "axios";
import { Region } from "../../../../constants/Project";
import { Whiteboard } from "../../../../constants/Config";
import { runTimeLogger } from "../../../../logger";

/**
 * whiteboard create room api
 * @param {Region} region - whiteboard room region
 * @param {number} limit - (default: 0 = no limit)
 * @return {string} whiteboard room uuid, not room model's room_uuid
 */

const wrapWhiteboardRequest = function <R>(methodDescription: string, execute: (...args: any) => Promise<R>): (...args: any) => Promise<R> {
    return (...args: any[]): Promise<R> => {
        try {
            return execute(args);
        } catch (error) {
            runTimeLogger.error(`request whiteboard ${methodDescription} failed, error: ${error}`);
            if (error.isAxiosError) {
                runTimeLogger.error(`get netless error, status: ${error.response.status}, response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }

    };
};

export const whiteboardCreateRoom = wrapWhiteboardRequest(
    "whiteboardCreateRoom",
    async (region: Region, limit = 0): Promise<string> => {
        try {
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
        } catch (error) {
            runTimeLogger.error(`request whiteboard create room failed, error: ${error}`);
            if (error.isAxiosError) {
                runTimeLogger.error(`get netless error, status: ${error.response.status}, response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
);

export const whiteboardBanRoom =
    wrapWhiteboardRequest(
        "whiteboardBanRoom",
        async (
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
        });

export const whiteboardCreateConversionTask =
    wrapWhiteboardRequest(
        "whiteboardCreateConversionTask",

        async (
            body: CreateConversionTaskParams,
        ): Promise<AxiosResponse<TaskCreated>> => {
            return await ax.post<TaskCreated>(
                "https://api.netless.link/v5/services/conversion/tasks",
                body,
                {
                    headers: {
                        token: createWhiteboardSDKToken(),
                        region: Whiteboard.convertRegion,
                    },
                },
            );
        });

export const whiteboardQueryConversionTask =
    wrapWhiteboardRequest(
        "whiteboardQueryConversionTask",
        async (
            uuid: string,
            type: "static" | "dynamic",
        ): Promise<AxiosResponse<TaskStatus>> => {
            return await ax.get<TaskStatus>(
                `https://api.netless.link/v5/services/conversion/tasks/${uuid}?type=${type}`,
                {
                    headers: {
                        token: createWhiteboardSDKToken(),
                        region: Whiteboard.convertRegion,
                    },
                },
            );
        });

export const whiteboardCreateProjectorTask =
    wrapWhiteboardRequest(
        "whiteboardCreateProjectorTask",
        async (
            body: CreateProjectorTaskParams,
        ): Promise<AxiosResponse<ProjectorTaskCreated>> => {
            return await ax.post<ProjectorTaskCreated>(
                "https://api.netless.link/v5/projector/tasks",
                {
                    ...body,
                    preview: true,
                    pack: false,
                },
                {
                    headers: {
                        token: createWhiteboardSDKToken(),
                        region: Whiteboard.convertRegion,
                    },
                },
            );
        });

export const whiteboardQueryProjectorTask =
    wrapWhiteboardRequest(
        "whiteboardQueryProjectorTask",
        async (
            uuid: string,
        ): Promise<AxiosResponse<ProjectorTaskStatus>> => {
            return await ax.get<ProjectorTaskStatus>(
                `https://api.netless.link/v5/projector/tasks/${uuid}`,
                {
                    headers: {
                        token: createWhiteboardSDKToken(),
                        region: Whiteboard.convertRegion,
                    },
                },
            );
        });

interface CreateProjectorTaskParams {
    resource: string;
    preview?: boolean;
    pack?: boolean;
    webhookEndpoint?: string;
    webhookRetry?: number;
    targetStorageDriver?: {
        ak?: string;
        sk?: string;
        token?: string;
        bucket: string;
        path?: string;
        provider: "aliyun" | "qiniu" | "aws" | "qcloud" | "ucloud" | "huaweicloud";
        region: string;
        domain?: string;
    };
}

interface ProjectorTaskCreated {
    uuid: string;
    status: "Waiting" | "Converting" | "Finished" | "Fail" | "Abort";
    errorCode?: string;
    errorMessage?: string;
    convertedPercentage?: number;
    prefix?: string;
}

interface ProjectorTaskStatus {
    uuid: string;
    status: "Waiting" | "Converting" | "Finished" | "Fail" | "Abort";
    errorCode?: string;
    errorMessage?: string;
    convertedPercentage?: number;
    prefix?: string;
}

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
    canvasVersion: boolean;
}

export interface TaskCreated {
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
