import { Credentials } from "ali-oss";
import { v4 } from "uuid";
import { Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import { CloudStorageConfigsDAO } from "../../../../dao";
import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { alibabaCloudGetSTSToken } from "../../../../utils/request/alibabaCloud/alibabaCloud";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";

export const alibabaCloudUploadStart = async (
    req: PatchRequest<{
        Body: AlibabaCloudUploadStartBody;
    }>,
): Response<AlibabaCloudUploadStartResponse> => {
    const { fileUUID, fileName, fileSize } = req.body;
    const { userUUID } = req.user;

    if (fileUUID) {
        try {
            const isFileExist = await RedisService.get(
                RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            );
            if (isFileExist) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.FileExists,
                };
            }
        } catch (err) {
            console.log(err);
        }
    }

    try {
        const cloudStorageConfig = await CloudStorageConfigsDAO().findOne(["total_usage"], {
            user_uuid: userUUID,
        });

        const totalUsage = (Number(cloudStorageConfig?.total_usage) || 0) + fileSize;

        // total_usage size limit to 2GB
        if (totalUsage > 1024 * 1024 * 1024 * 2) {
            return {
                status: Status.Failed,
                code: ErrorCode.NotEnoughTotalUsage,
            };
        }

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
                stsToken: await alibabaCloudGetSTSToken(),
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
    fileUUID?: string;
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
            fileUUID: {
                type: "string",
                format: "uuid-v4",
                nullable: true,
            },
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
