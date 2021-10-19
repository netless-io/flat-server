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
import { ossClient } from "../Utils";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { ControllerError } from "../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../ErrorCode";
import { URL } from "url";
import path from "path";

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
            .addSelect("f.file_size", "file_size")
            .addSelect("f.file_url", "file_url")
            .addSelect("f.file_name", "file_name")
            .addSelect("f.file_uuid", "file_uuid")
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

            fileInfo.forEach(({ file_url, file_uuid, file_name, file_size, region }) => {
                if (typeof fileList[region] === "undefined") {
                    fileList[region] = [];
                }

                (fileList as Required<FileListType>)[region].push(
                    AlibabaCloudRemoveFile.willDeleteFilePath(file_name, file_uuid, file_url),
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

    private static willDeleteFilePath(fileName: string, fileUUID: string, fileURL: string): string {
        const suffix = path.extname(fileName);

        // remove first char: /
        const pathKey = new URL(fileURL).pathname.slice(1);

        // old: PREFIX/UUID.png
        // new: PREFIX/2021-10/12/UUID/UUID.png
        const newFilePathSuffix = `${fileUUID}/${fileUUID}${suffix}`;

        // PREFIX/2021-10/12/UUID/UUID.png => PREFIX/2021-10/12/UUID/
        if (fileURL.endsWith(newFilePathSuffix)) {
            return pathKey.replace(`${fileUUID}${suffix}`, "");
        }

        return pathKey;
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
    file_size: number;
    file_url: string;
    file_uuid: string;
    file_name: string;
    region: Region;
}
