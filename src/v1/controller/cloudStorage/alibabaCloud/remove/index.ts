import { createQueryBuilder, getConnection, In } from "typeorm";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import {
    CloudStorageConfigsDAO,
    CloudStorageUserFilesDAO,
    CloudStorageFilesDAO,
} from "../../../../../dao";
import { CloudStorageFilesModel } from "../../../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../../../model/cloudStorage/CloudStorageUserFiles";
import { FastifySchema, PatchRequest, Response } from "../../../../../types/Server";
import { getFilePath, ossClient } from "../Utils";

export const alibabaCloudRemoveFile = async (
    req: PatchRequest<{
        Body: AlibabaCloudRemoveFileBody;
    }>,
): Response<AlibabaCloudRemoveFileResponse> => {
    const { fileUUIDs } = req.body;
    const { userUUID } = req.user;

    try {
        const fileInfo = await createQueryBuilder(CloudStorageUserFilesModel, "fc")
            .addSelect("f.file_uuid", "file_uuid")
            .addSelect("f.file_name", "file_name")
            .addSelect("f.file_size", "file_size")
            .innerJoin(CloudStorageFilesModel, "f", "fc.file_uuid = f.file_uuid")
            .where(
                `f.file_uuid IN (:...fileUUIDs)
                AND fc.is_delete = false
                AND f.is_delete = false`,
                {
                    fileUUIDs,
                },
            )
            .getRawMany();

        if (fileInfo.length === 0) {
            return {
                status: Status.Success,
                data: {},
            };
        }

        const cloudStorageConfigsInfo = await CloudStorageConfigsDAO().findOne(["total_usage"], {
            user_uuid: userUUID,
        });

        const totalUsage = Number(cloudStorageConfigsInfo?.total_usage) || 0;

        const { fileURLList, remainingTotalUsage } = ((): {
            fileURLList: string[];
            remainingTotalUsage: number;
        } => {
            const fileURLList: string[] = [];
            let remainingTotalUsage = totalUsage;

            fileInfo.forEach(({ file_uuid, file_name, file_size }) => {
                fileURLList.push(getFilePath(file_name, file_uuid));
                remainingTotalUsage -= file_size;
            });

            return {
                fileURLList,
                remainingTotalUsage: remainingTotalUsage < 0 ? 0 : remainingTotalUsage,
            };
        })();

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                CloudStorageUserFilesDAO(t).remove({
                    file_uuid: In(fileUUIDs),
                    user_uuid: userUUID,
                }),
            );

            commands.push(
                CloudStorageFilesDAO(t).remove({
                    file_uuid: In(fileUUIDs),
                }),
            );

            commands.push(
                CloudStorageConfigsDAO(t).update(
                    {
                        total_usage: String(remainingTotalUsage),
                    },
                    {
                        user_uuid: userUUID,
                    },
                ),
            );

            await Promise.all(commands);
            await ossClient.deleteMulti(fileURLList);
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

interface AlibabaCloudRemoveFileBody {
    fileUUIDs: string[];
}

export const alibabaCloudRemoveFileSchemaType: FastifySchema<{
    body: AlibabaCloudRemoveFileBody;
}> = {
    body: {
        type: "object",
        required: ["fileUUIDs"],
        properties: {
            fileUUIDs: {
                type: "array",
                items: {
                    type: "string",
                    format: "uuid-v4",
                },
            },
        },
    },
};

interface AlibabaCloudRemoveFileResponse {}
