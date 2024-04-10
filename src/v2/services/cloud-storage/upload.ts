import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";
import {
    CloudStorageUploadFinishConfig,
    CloudStorageUploadStartConfig,
    CloudStorageUploadStartReturn,
    GetFileInfoByRedisReturn,
    InsertFileInfo,
    TempPhotoUploadFinishConfig,
    TempPhotoUploadStartConfig,
    TempPhotoUploadStartReturn,
} from "./upload.type";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { useOnceService } from "../../service-locator";
import RedisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../utils/Redis";
import { CloudStorage, Whiteboard } from "../../../constants/Config";
import { cloudStorageConfigsDAO, cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";
import { v4 } from "uuid";
import { format } from "date-fns/fp";
import path from "path";
import {
    FileConvertStep,
    FileResourceType,
    whiteboardResourceType,
} from "../../../model/cloudStorage/Constants";
import { FilePayload } from "../../../model/cloudStorage/Types";
import { CloudStorageDirectoryService } from "./directory";
import { CloudStorageFileService } from "./file";

export class CloudStorageUploadService {
    private readonly logger = createLoggerService<"CloudStorageUpload">({
        serviceName: "CloudStorageUpload",
        ids: this.ids,
    });

    private readonly oss = useOnceService("oss", this.ids);

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async start(
        config: CloudStorageUploadStartConfig,
    ): Promise<CloudStorageUploadStartReturn> {
        const { fileName, fileSize, targetDirectoryPath, convertType } = config;
        await this.assertConcurrentLimit();
        await this.assertConcurrentFileSize(await this.getTotalUsageByUpdated(fileSize));
        await new CloudStorageDirectoryService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        ).assertExists(targetDirectoryPath);

        const fileService = new CloudStorageFileService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );
        const fileResourceType =
            convertType === FileResourceType.WhiteboardProjector
                ? fileService.getFileResourceTypeByFileNameUseProjector(fileName)
                : fileService.getFileResourceTypeByFileName(fileName);

        const fileUUID = v4();
        await RedisService.hmset(
            RedisKey.cloudStorageFileInfo(this.userUUID, fileUUID),
            {
                fileName,
                fileSize: String(fileSize),
                targetDirectoryPath,
                fileResourceType,
            },
            60 * 20,
        );

        const ossFilePath = CloudStorageUploadService.generateOSSFilePath(fileName, fileUUID);
        const { policy, signature } = this.oss.policyTemplate(fileName, ossFilePath, fileSize);

        return {
            fileUUID,
            ossFilePath,
            ossDomain: this.oss.domain,
            policy,
            signature,
        };
    }

    public async finish(config: CloudStorageUploadFinishConfig): Promise<void> {
        const { fileUUID } = config;

        const { fileName, fileSize, targetDirectoryPath, fileResourceType } =
            await this.getFileInfoByRedis(fileUUID);

        await new CloudStorageDirectoryService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        ).assertExists(targetDirectoryPath);

        const ossFilePath = CloudStorageUploadService.generateOSSFilePath(fileName, fileUUID);
        await this.oss.assertExists(ossFilePath);

        const totalUsage = await this.getTotalUsageByUpdated(fileSize);

        await Promise.all([
            this.insertFile({
                fileName,
                fileSize,
                fileURL: `${this.oss.domain}/${ossFilePath}`,
                fileUUID,
                directoryPath: targetDirectoryPath,
                fileResourceType,
            }),
            this.updateTotalUsage(totalUsage),
        ]);

        await RedisService.del(RedisKey.cloudStorageFileInfo(this.userUUID, fileUUID));
    }

    public async insertFile(fileInfo: InsertFileInfo): Promise<[void, void]> {
        return await Promise.all([
            cloudStorageFilesDAO.insert(this.DBTransaction, {
                file_name: fileInfo.fileName,
                file_size: fileInfo.fileSize,
                file_url: fileInfo.fileURL,
                file_uuid: fileInfo.fileUUID,
                directory_path: fileInfo.directoryPath,
                resource_type: fileInfo.fileResourceType,
                payload: CloudStorageUploadService.generateFilePayload(fileInfo.fileResourceType),
            }),
            cloudStorageUserFilesDAO.insert(this.DBTransaction, {
                user_uuid: this.userUUID,
                file_uuid: fileInfo.fileUUID,
            }),
        ]);
    }

    public async updateTotalUsage(totalUsage: number): Promise<void> {
        return await cloudStorageConfigsDAO.insert(
            this.DBTransaction,
            {
                user_uuid: this.userUUID,
                total_usage: String(totalUsage),
            },
            {
                orUpdate: ["total_usage"],
            },
        );
    }

    public async assertConcurrentLimit(): Promise<void> {
        const uploadingFiles = await RedisService.scan(
            RedisKey.cloudStorageFileInfo(this.userUUID, "*"),
            CloudStorage.concurrent + 1,
        );

        if (uploadingFiles.length >= CloudStorage.concurrent) {
            throw new FError(ErrorCode.UploadConcurrentLimit);
        }
    }

    public async getTotalUsageByUpdated(currentFileSize: number): Promise<number> {
        const { total_usage } = await cloudStorageConfigsDAO.findOne(
            this.DBTransaction,
            "total_usage",
            {
                user_uuid: this.userUUID,
            },
        );
        const totalUsage = (Number(total_usage) || 0) + currentFileSize;

        if (totalUsage > CloudStorage.totalSize) {
            this.logger.info("totalUsage > CloudStorage.totalSize", {
                CloudStorageUpload: {
                    totalUsage,
                    presetTotalSize: CloudStorage.totalSize,
                },
            });
            throw new FError(ErrorCode.NotEnoughTotalUsage);
        }

        return totalUsage;
    }

    public async assertConcurrentFileSize(totalUsage: number): Promise<void> {
        const uploadingFiles = await RedisService.scan(
            RedisKey.cloudStorageFileInfo(this.userUUID, "*"),
            CloudStorage.concurrent + 1,
        );

        const uploadingFileTotalSize = await uploadingFiles.reduce(async (accP, current) => {
            const accFileSize = await accP;

            const currentFileSize = await RedisService.hmget(current, "fileSize");

            return accFileSize + (Number(currentFileSize) || 0);
        }, Promise.resolve(totalUsage));

        if (uploadingFileTotalSize > CloudStorage.totalSize) {
            this.logger.info("uploadingFileTotalSize > CloudStorage.totalSize", {
                CloudStorageUpload: {
                    uploadingFileTotalSize,
                    presetTotalSize: CloudStorage.totalSize,
                },
            });
            throw new FError(ErrorCode.NotEnoughTotalUsage);
        }
    }

    public static generateOSSFilePath = (fileName: string, fileUUID: string): string => {
        const datePath = format("yyyy-MM/dd")(Date.now());
        // e.g: PREFIX/2021-10/19/UUID/UUID.txt
        return `${CloudStorage.prefixPath}/${datePath}/${fileUUID}/${fileUUID}${path.extname(
            fileName,
        )}`;
    };

    public async getFileInfoByRedis(fileUUID: string): Promise<GetFileInfoByRedisReturn> {
        const fileInfo = await RedisService.hmget(
            RedisKey.cloudStorageFileInfo(this.userUUID, fileUUID),
            ["fileName", "fileSize", "targetDirectoryPath", "fileResourceType"],
        );

        const fileName = fileInfo[0];
        const fileSize = Number(fileInfo[1] || undefined);
        const targetDirectoryPath = fileInfo[2];
        const fileResourceType = fileInfo[3] as FileResourceType | null;

        if (!fileName || Number.isNaN(fileSize) || !targetDirectoryPath || !fileResourceType) {
            this.logger.info("not found file in redis", {
                CloudStorageUpload: {
                    fileNameIsEmpty: !fileName,
                    fileSizeIsNaN: Number.isNaN(fileSize),
                    targetDirectoryPathIsEmpty: !targetDirectoryPath,
                    fileResourceTypeIsEmpty: !fileResourceType,
                },
            });
            throw new FError(ErrorCode.FileNotFound);
        }

        return {
            fileName,
            fileSize,
            targetDirectoryPath,
            fileResourceType,
        };
    }

    public static generateFilePayload(fileResourceType: FileResourceType): FilePayload {
        return whiteboardResourceType.includes(fileResourceType)
            ? {
                  region: Whiteboard.convertRegion,
                  convertStep: FileConvertStep.None,
              }
            : {};
    }

    // Codes below are for temp photo uploading.
    public static generateTempPhotoOSSFilePath = (fileName: string, fileUUID: string): string => {
        const datePath = format("yyyy-MM/dd")(Date.now());
        const prefix = CloudStorage.tempPhoto.prefixPath;
        // e.g: PREFIX/temp-photo/2021-10/19/UUID/UUID.jpg
        return `${prefix}/${datePath}/${fileUUID}/${fileUUID}${path.extname(fileName)}`;
    };

    public async assertTempPhotoConcurrentLimit(): Promise<void> {
        const uploadingFiles = await RedisService.scan(
            RedisKey.cloudStorageTempPhotoInfo(this.userUUID, "*"),
            CloudStorage.tempPhoto.totalFiles + 1,
        );

        if (uploadingFiles.length >= CloudStorage.tempPhoto.totalFiles) {
            throw new FError(ErrorCode.UploadConcurrentLimit);
        }
    }

    public async getTempPhotoFileInfoByRedis(
        fileUUID: string,
    ): Promise<TempPhotoUploadStartConfig> {
        const fileInfo = await RedisService.hmget(
            RedisKey.cloudStorageTempPhotoInfo(this.userUUID, fileUUID),
            ["fileName", "fileSize"],
        );

        const fileName = fileInfo[0];
        const fileSize = Number(fileInfo[1] || undefined);

        if (!fileName || Number.isNaN(fileSize)) {
            this.logger.info("not found temp photo in redis", {
                CloudStorageUpload: {
                    fileNameIsEmpty: !fileName,
                    fileSizeIsNaN: Number.isNaN(fileSize),
                },
            });
            throw new FError(ErrorCode.FileNotFound);
        }

        return {
            fileName,
            fileSize,
        };
    }

    public async tempPhotoStart(
        config: TempPhotoUploadStartConfig,
    ): Promise<TempPhotoUploadStartReturn> {
        const { fileName, fileSize } = config;
        await this.assertTempPhotoConcurrentLimit();

        const fileUUID = v4();
        const oneDay = 60 * 60 * 24;
        await RedisService.hmset(
            RedisKey.cloudStorageTempPhotoInfo(this.userUUID, fileUUID),
            {
                fileName,
                fileSize: String(fileSize),
            },
            oneDay,
        );

        const ossFilePath = CloudStorageUploadService.generateTempPhotoOSSFilePath(
            fileName,
            fileUUID,
        );
        const { policy, signature } = this.oss.policyTemplate(fileName, ossFilePath, fileSize);

        return {
            fileUUID,
            ossFilePath,
            ossDomain: this.oss.domain,
            policy,
            signature,
        };
    }

    public async tempPhotoFinish(config: TempPhotoUploadFinishConfig): Promise<void> {
        const { fileUUID } = config;

        const { fileName } = await this.getTempPhotoFileInfoByRedis(fileUUID);

        const ossFilePath = CloudStorageUploadService.generateTempPhotoOSSFilePath(
            fileName,
            fileUUID,
        );

        await this.oss.assertExists(ossFilePath);
    }
}
