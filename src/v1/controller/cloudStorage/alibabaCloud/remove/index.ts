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
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { ControllerError } from "../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../ErrorCode";
import { URL } from "url";
import path from "path";
import { ossClient } from "../Utils";
import OSS from "ali-oss";
import { FileAffiliation } from "../../../../../model/cloudStorage/Constants";
import { FilePayload } from "../../../../../model/cloudStorage/Types";

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
            .addSelect("f.region", "region")
            .innerJoin(CloudStorageFilesModel, "f", "fc.file_uuid = f.file_uuid")
            .where(
                `f.file_uuid IN (:...fileUUIDs)
                AND f.affiliation IN (:...affiliation)
                AND fc.user_uuid = :userUUID
                AND fc.is_delete = false
                AND f.is_delete = false`,
                {
                    fileUUIDs,
                    userUUID,
                    affiliation: [
                        FileAffiliation.WhiteboardConvert,
                        FileAffiliation.LocalCourseware,
                        FileAffiliation.NormalResources,
                    ],
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

            fileInfo.forEach(({ file_url, file_size, payload }) => {
                if (!("region" in payload)) {
                    throw new Error("unsupported current file remove");
                }

                const region = payload.region;

                if (typeof fileList[region] === "undefined") {
                    fileList[region] = [];
                }

                (fileList as Required<FileListType>)[region].push(
                    new URL(file_url).pathname.slice(1),
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

            await AlibabaCloudRemoveFile.deleteFileInOSS(fileList);
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

    private static async deleteFileInOSS(fileList: FileListType): Promise<any> {
        await Promise.all(
            Object.keys(fileList).map(region => {
                return ossClient[region as Region].deleteMulti(fileList[region as Region]!);
            }),
        );

        const newOSSFilePathList: [Region, string][] = [];

        for (const key in fileList) {
            const value = fileList[key as Region]!;

            for (const filePath of value) {
                const suffix = path.extname(filePath);
                const fileUUID = path.basename(filePath, suffix);
                const fileName = `${fileUUID}${suffix}`;

                // old: PREFIX/UUID.png
                // new: PREFIX/2021-10/12/UUID/UUID.png
                if (filePath.endsWith(`${fileUUID}/${fileName}`)) {
                    newOSSFilePathList.push([
                        key as Region,
                        filePath.substr(0, filePath.length - fileName.length),
                    ]);
                }
            }
        }

        for (const [region, directory] of newOSSFilePathList) {
            await this.recursionDirectory(ossClient[region], directory);
        }

        return newOSSFilePathList;
    }

    private static async recursionDirectory(
        ossClient: OSS,
        directory: string,
        marker?: string,
    ): Promise<void> {
        const files = await ossClient.list(
            {
                prefix: directory,
                marker: marker,
                "max-keys": 1000,
            },
            {},
        );

        if (files.objects && files.objects.length !== 0) {
            await ossClient.deleteMulti(files.objects.map(meta => meta.name));
        }

        if (!files.isTruncated) {
            return;
        }

        await this.recursionDirectory(ossClient, directory, files.nextMarker);
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
    payload: FilePayload;
}
