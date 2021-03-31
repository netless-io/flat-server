import { getConnection } from "typeorm";
import {
    CloudStorageConfigsDAO,
    CloudStorageFilesDAO,
    CloudStorageUserFilesDAO,
} from "../../../../dao";
import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage } from "./Utils";
import { getFilePath, isExistObject, getOSSFileURLPath } from "../Utils";

export const alibabaCloudUploadFinish = async (
    req: PatchRequest<{
        Body: AlibabaCloudUploadFinishBody;
    }>,
): Response<AlibabaCloudUploadFinishResponse> => {
    const { fileUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const fileInfo = await RedisService.hmget(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            ["fileName", "fileSize"],
        );

        const fileName = fileInfo[0];
        const fileSize = Number(fileInfo[1]);

        if (!fileName || Number.isNaN(fileSize)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const fullPath = getFilePath(fileName, fileUUID);

        await isExistObject(fullPath);

        const { fail, totalUsage } = await checkTotalUsage(userUUID, fileSize);

        if (fail) {
            return {
                status: Status.Failed,
                code: ErrorCode.NotEnoughTotalUsage,
            };
        }

        const alibabaCloudFileURL = getOSSFileURLPath(fullPath);

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                CloudStorageFilesDAO(t).insert({
                    file_name: fileName,
                    file_size: fileSize,
                    file_url: alibabaCloudFileURL,
                    file_uuid: fileUUID,
                }),
            );

            commands.push(
                CloudStorageUserFilesDAO(t).insert({
                    user_uuid: userUUID,
                    file_uuid: fileUUID,
                }),
            );

            commands.push(
                CloudStorageConfigsDAO(t).insert(
                    {
                        user_uuid: userUUID,
                        total_usage: String(totalUsage),
                    },
                    {
                        total_usage: String(totalUsage),
                    },
                ),
            );

            await Promise.all(commands);
            await RedisService.del(RedisKey.cloudStorageFileInfo(userUUID, fileUUID));
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
