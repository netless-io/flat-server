import { v4 } from "uuid";
import { CloudStorage } from "../../../../../constants/Process";
import { Status } from "../../../../../constants/Project";

import { ErrorCode } from "../../../../../ErrorCode";
import { Controller, FastifySchema } from "../../../../../types/Server";
import { getFilePath, policyTemplate } from "../Utils";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage } from "./Utils";
import { parseError } from "../../../../../Logger";

export const alibabaCloudUploadStart: Controller<
    AlibabaCloudUploadStartRequest,
    AlibabaCloudUploadStartResponse
> = async ({ req, logger }) => {
    const { fileName, fileSize } = req.body;
    const { userUUID } = req.user;

    try {
        // check upload concurrent and file size and total usage
        {
            const uploadingFiles = await RedisService.scan(
                RedisKey.cloudStorageFileInfo(userUUID, "*"),
                CloudStorage.CONCURRENT + 1,
                true,
            );

            if (uploadingFiles.length >= CloudStorage.CONCURRENT) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.UploadConcurrentLimit,
                };
            }

            const { totalUsage, fail } = await checkTotalUsage(userUUID, fileSize);

            if (fail) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.NotEnoughTotalUsage,
                };
            }

            const uploadingFileTotalSize = await uploadingFiles.reduce(async (accP, current) => {
                const accFileSize = await accP;

                const currentFileSize = await RedisService.hmget(current, "fileSize");

                return accFileSize + (Number(currentFileSize) || 0);
            }, Promise.resolve(totalUsage));

            if (uploadingFileTotalSize > CloudStorage.TOTAL_SIZE) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.NotEnoughTotalUsage,
                };
            }
        }

        const fileUUID = v4();
        const filePath = getFilePath(fileName, fileUUID);
        const { policy, signature } = policyTemplate(fileName, filePath, fileSize);

        await RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            {
                fileName,
                fileSize: String(fileSize),
            },
            60 * 60,
        );

        return {
            status: Status.Success,
            data: {
                fileUUID,
                filePath,
                policy,
                signature,
            },
        };
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface AlibabaCloudUploadStartRequest {
    body: {
        fileName: string;
        fileSize: number;
    };
}

export const alibabaCloudUploadStartSchemaType: FastifySchema<AlibabaCloudUploadStartRequest> = {
    body: {
        type: "object",
        required: ["fileName", "fileSize"],
        properties: {
            fileName: {
                type: "string",
                format: "file-suffix",
                maxLength: 128,
            },
            fileSize: {
                type: "number",
                minimum: 1,
                maximum: CloudStorage.SINGLE_FILE_SIZE,
            },
        },
    },
};

interface AlibabaCloudUploadStartResponse {
    fileUUID: string;
    filePath: string;
    policy: string;
    signature: string;
}
