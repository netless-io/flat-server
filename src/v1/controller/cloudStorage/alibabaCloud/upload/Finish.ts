import { getConnection } from "typeorm";
import {
    CloudStorageConfigsDAO,
    CloudStorageFilesDAO,
    CloudStorageUserFilesDAO,
} from "../../../../../dao";
import { Controller, FastifySchema } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage } from "./Utils";
import { getFilePath, isExistObject, getOSSFileURLPath } from "../Utils";
import { parseError } from "../../../../../logger";

export const alibabaCloudUploadFinish: Controller<
    AlibabaCloudUploadFinishRequest,
    AlibabaCloudUploadFinishResponse
> = async ({ req, logger }) => {
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

        if (!(await isExistObject(fullPath))) {
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
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface AlibabaCloudUploadFinishRequest {
    body: {
        fileUUID: string;
    };
}

export const alibabaCloudUploadFinishSchemaType: FastifySchema<AlibabaCloudUploadFinishRequest> = {
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
