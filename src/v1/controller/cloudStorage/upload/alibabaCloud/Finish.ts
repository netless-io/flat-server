import { CloudStorageConfigsDAO, CloudStorageFilesDAO } from "../../../../dao";
import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { AlibabaCloud, Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage, getOSSFileSize } from "./utils";
import { getConnection } from "typeorm";
import { extname } from "path";

export const alibabaCloudUploadFinish = async (
    req: PatchRequest<{
        Body: AlibabaCloudUploadFinishBody;
    }>,
): Response<AlibabaCloudUploadFinishResponse> => {
    const { fileUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const cloudStorageFileInfo = await RedisService.get(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
        );

        if (!cloudStorageFileInfo) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const fileName = cloudStorageFileInfo;

        const fullPath = `${userUUID}/${fileUUID}${extname(fileName)}`;
        const fileSize = await getOSSFileSize(fullPath);

        if (Number.isNaN(fileSize)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const { fail, totalUsage } = await checkTotalUsage(userUUID, fileSize);

        if (fail) {
            return {
                status: Status.Failed,
                code: ErrorCode.NotEnoughTotalUsage,
            };
        }

        const alibabaCloudFileURL = `https://${AlibabaCloud.OSS_BUCKET}.${AlibabaCloud.OSS_REGION}.aliyuncs.com/${fullPath}`;

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                CloudStorageFilesDAO(t).insert({
                    file_name: fileName,
                    file_size: fileSize,
                    file_url: alibabaCloudFileURL,
                    file_uuid: fileUUID,
                    convert_result: [],
                }),
            );

            commands.push(
                CloudStorageConfigsDAO(t).update(
                    {
                        total_usage: String(totalUsage),
                    },
                    {
                        user_uuid: userUUID,
                    },
                ),
            );

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {},
        };
    } catch (err) {
        console.error(err);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface AlibabaCloudUploadFinishBody {
    fileUUID: string;
}

export const alibabaCloudUploadFinishSchemaType: FastifySchema<{
    body: AlibabaCloudUploadFinishBody;
}> = {
    body: {
        type: "object",
        required: ["fileUUID"],
        properties: {
            fileUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};

interface AlibabaCloudUploadFinishResponse {}
