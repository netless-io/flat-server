import { v4 } from "uuid";
import { CloudStorage, Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { getFilePath, policyTemplate } from "../Utils";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage } from "./Utils";

export const alibabaCloudUploadStart = async (
    req: PatchRequest<{
        Body: AlibabaCloudUploadStartBody;
    }>,
): Response<AlibabaCloudUploadStartResponse> => {
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
        console.error(err);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface AlibabaCloudUploadStartBody {
    fileName: string;
    fileSize: number;
}

export const alibabaCloudUploadStartSchemaType: FastifySchema<{
    body: AlibabaCloudUploadStartBody;
}> = {
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
