import { Credentials } from "ali-oss";
import { v4 } from "uuid";
import { CloudStorage, Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { alibabaCloudGetSTSToken } from "./Utils";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage, fileSizeTooBig } from "../Utils";

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
            const unfinishedUploadFile = await RedisService.scan(
                RedisKey.cloudStorageFileInfo(userUUID, "*"),
                CloudStorage.CONCURRENT + 1,
                true,
            );

            if (unfinishedUploadFile.length >= CloudStorage.CONCURRENT) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.UploadConcurrentLimit,
                };
            }

            if (fileSizeTooBig(fileSize)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.FileSizeTooBig,
                };
            }

            const { fail } = await checkTotalUsage(userUUID, fileSize);

            if (fail) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.NotEnoughTotalUsage,
                };
            }
        }

        const stsToken = await alibabaCloudGetSTSToken();
        const fileUUID = v4();

        await RedisService.set(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            fileName,
            60 * 60,
        );

        return {
            status: Status.Success,
            data: {
                fileUUID,
                stsToken,
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
                maxLength: 30,
            },
            fileSize: {
                type: "integer",
            },
        },
    },
};

interface AlibabaCloudUploadStartResponse {
    fileUUID: string;
    stsToken: Credentials;
}
