import { createQueryBuilder, getConnection, In } from "typeorm";
import { Region, Status } from "../../../../../constants/Project";
import {
    CloudStorageConfigsDAO,
    CloudStorageFilesDAO,
    CloudStorageUserFilesDAO,
} from "../../../../../dao";
import { CloudStorageFilesModel } from "../../../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../../../model/cloudStorage/CloudStorageUserFiles";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { getFilePath, ossClient } from "../Utils";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { ControllerError } from "../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../ErrorCode";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/alibaba-cloud/remove",
    auth: true,
})
export class AlibabaCloudRemoveFile extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
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
                    minItems: 1,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUIDs } = this.body;
        const userUUID = this.userUUID;

        await this.assertFilesOwnerIsCurrentUser();

        const fileInfo: FileInfoType[] = await createQueryBuilder(CloudStorageUserFilesModel, "fc")
            .addSelect("f.file_uuid", "file_uuid")
            .addSelect("f.file_name", "file_name")
            .addSelect("f.file_size", "file_size")
            .addSelect("f.region", "region")
            .innerJoin(CloudStorageFilesModel, "f", "fc.file_uuid = f.file_uuid")
            .where(
                `f.file_uuid IN (:...fileUUIDs)
                AND fc.user_uuid = :userUUID
                AND fc.is_delete = false
                AND f.is_delete = false`,
                {
                    fileUUIDs,
                    userUUID,
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

        const { fileList, remainingTotalUsage } = ((): {
            fileList: FileListType;
            remainingTotalUsage: number;
        } => {
            const fileList: FileListType = {};
            let remainingTotalUsage = totalUsage;

            fileInfo.forEach(({ file_uuid, file_name, file_size, region }) => {
                if (typeof fileList[region] === "undefined") {
                    fileList[region] = [];
                }

                (fileList as Required<FileListType>)[region].push(
                    getFilePath(file_name, file_uuid),
                );
                remainingTotalUsage -= file_size;
            });

            return {
                fileList,
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

            const deleteMultiByRegion = Object.keys(fileList).map(region => {
                return ossClient[region as Region].deleteMulti(fileList[region as Region]!);
            });

            await Promise.all(deleteMultiByRegion);
        });

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private async assertFilesOwnerIsCurrentUser(): Promise<void> {
        const filesOwner = await CloudStorageUserFilesDAO().find(["user_uuid"], {
            file_uuid: In(this.body.fileUUIDs),
        });

        for (const { user_uuid } of filesOwner) {
            if (user_uuid !== this.userUUID) {
                throw new ControllerError(ErrorCode.NotPermission);
            }
        }
    }
}

interface RequestType {
    body: {
        fileUUIDs: string[];
    };
}

interface ResponseType {}

type FileListType = {
    [region in Region]?: string[];
};

interface FileInfoType {
    file_uuid: string;
    file_name: string;
    file_size: number;
    region: Region;
}
