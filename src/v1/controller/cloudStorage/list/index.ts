import { createQueryBuilder } from "typeorm";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { CloudStorageConfigsDAO } from "../../../../dao";
import { CloudStorageFilesModel } from "../../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../../model/cloudStorage/CloudStorageUserFiles";
import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { FileConvertStep } from "../../../../model/cloudStorage/Constants";

export const cloudStorageList = async (
    req: PatchRequest<{
        Querystring: CloudStorageListQuery;
    }>,
): Response<CloudStorageListResponse> => {
    const { userUUID } = req.user;
    const { page } = req.query;

    try {
        const userInfo = await CloudStorageConfigsDAO().findOne(["total_usage"], {
            user_uuid: userUUID,
        });

        if (userInfo === undefined) {
            return {
                status: Status.Success,
                data: {
                    totalUsage: 0,
                    files: [],
                },
            };
        }

        const files = await createQueryBuilder(CloudStorageUserFilesModel, "fc")
            .addSelect("f.file_uuid", "file_uuid")
            .addSelect("f.file_name", "file_name")
            .addSelect("f.file_size", "file_size")
            .addSelect("f.file_url", "file_url")
            .addSelect("f.convert_step", "convert_step")
            .addSelect("f.task_uuid", "task_uuid")
            .addSelect("f.task_token", "task_token")
            .addSelect("f.created_at", "create_at")
            .innerJoin(CloudStorageFilesModel, "f", "fc.file_uuid = f.file_uuid")
            .where(
                `fc.user_uuid = :userUUID
                AND fc.is_delete = :isDelete
                AND f.is_delete = :isDelete`,
                {
                    userUUID,
                    isDelete: false,
                },
            )
            .offset((page - 1) * 50)
            .limit(50)
            .getRawMany();

        const resp = files.map((file: CloudStorageFile) => {
            return {
                fileUUID: file.file_uuid,
                fileName: file.file_name,
                fileSize: file.file_size,
                fileURL: file.file_url,
                convertStep: file.convert_step,
                taskUUID: file.task_uuid,
                taskToken: file.task_token,
                createAt: file.create_at.valueOf(),
            };
        });

        return {
            status: Status.Success,
            data: {
                totalUsage: Number(userInfo.total_usage),
                files: resp,
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

interface CloudStorageListQuery {
    page: number;
}

export const cloudStorageListSchemaType: FastifySchema<{
    querystring: CloudStorageListQuery;
}> = {
    querystring: {
        type: "object",
        required: ["page"],
        properties: {
            page: {
                type: "integer",
                maximum: 50,
                minimum: 1,
            },
        },
    },
};

interface CloudStorageListResponse {
    totalUsage: number;
    files: Array<{
        fileUUID: string;
        fileName: string;
        fileSize: number;
        fileURL: string;
        convertStep: FileConvertStep;
        taskUUID: string;
        taskToken: string;
        createAt: number;
    }>;
}

interface CloudStorageFile {
    file_uuid: string;
    file_name: string;
    file_size: number;
    file_url: string;
    convert_step: FileConvertStep;
    task_uuid: string;
    task_token: string;
    create_at: Date;
}
