import { cloudStorageConfigsDAO, cloudStorageUserFilesDAO } from "../../dao";
import { CloudStorageFilesModel } from "../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../model/cloudStorage/CloudStorageUserFiles";
import {
    CloudStorageInfoFindFileInfoReturn,
    CloudStorageInfoFindFilesInfoReturn,
    CloudStorageInfoList,
    CloudStorageInfoListParamsConfig,
    CloudStorageInfoListReturn,
    ListFilesAndTotalUsageByUserUUIDReturn,
} from "./info.type";
import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";
import { FileResourceType } from "../../../model/cloudStorage/Constants";
import { filePayloadParse } from "./internal/utils/file-payload-parse";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class CloudStorageInfoService {
    private readonly logger = createLoggerService<"cloudStorageInfo">({
        serviceName: "cloudStorageInfo",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async totalUsage(): Promise<number> {
        const { total_usage } = await cloudStorageConfigsDAO.findOne(
            this.DBTransaction,
            "total_usage",
            {
                user_uuid: this.userUUID,
            },
        );

        const totalUsage = Number(total_usage) || 0;
        this.logger.debug(`totalUsage is: ${totalUsage}`);

        return totalUsage;
    }

    public async list(
        config: CloudStorageInfoListParamsConfig,
    ): Promise<CloudStorageInfoListReturn[]> {
        const result: CloudStorageInfoList[] = await this.DBTransaction.createQueryBuilder(
            CloudStorageFilesModel,
            "f",
        )
            .addSelect("f.file_uuid", "fileUUID")
            .addSelect("f.file_name", "fileName")
            .addSelect("f.file_size", "fileSize")
            .addSelect("f.file_url", "fileURL")
            .addSelect("f.created_at", "createAt")
            .addSelect("f.payload", "payload")
            .addSelect("f.resource_type", "resourceType")
            .innerJoin(CloudStorageUserFilesModel, "uf", "uf.file_uuid = f.file_uuid")
            .where("uf.user_uuid = :userUUID", { userUUID: this.userUUID })
            .andWhere("f.directory_path = :directoryPath", { directoryPath: config.directoryPath })
            .andWhere("uf.is_delete = :isDelete", { isDelete: false })
            .andWhere("f.is_delete = :isDelete", { isDelete: false })
            // Directory always at the top
            .orderBy(`IF(f.resource_type = '${FileResourceType.Directory}', 0, 1)`)
            .addOrderBy("f.created_at", config.order)
            .offset((config.page - 1) * config.size)
            .limit(config.size)
            .getRawMany();

        const r = result.map(
            ({ fileUUID, fileName, fileSize, fileURL, createAt, resourceType, payload }) => {
                return {
                    fileUUID,
                    fileName,
                    fileSize,
                    fileURL,
                    resourceType,
                    createAt: createAt.valueOf(),
                    meta: filePayloadParse(resourceType, payload),
                };
            },
        );

        return r;
    }

    public async listFilesAndTotalUsageByUserUUID(
        config: CloudStorageInfoListParamsConfig,
    ): Promise<ListFilesAndTotalUsageByUserUUIDReturn> {
        return {
            totalUsage: await this.totalUsage(),
            files: await this.list(config),
            // directory path max length is 300
            canCreateDirectory: config.directoryPath.length < 299,
        };
    }

    public async findFilesInfo(): Promise<CloudStorageInfoFindFilesInfoReturn> {
        const result: Array<CloudStorageInfoFindFileInfoReturn> =
            await this.DBTransaction.createQueryBuilder(CloudStorageFilesModel, "f")
                .select("f.file_uuid", "fileUUID")
                .addSelect("f.directory_path", "directoryPath")
                .addSelect("f.file_name", "fileName")
                .addSelect("f.file_size", "fileSize")
                .addSelect("f.file_url", "fileURL")
                .addSelect("f.resource_type", "resourceType")
                .innerJoin(CloudStorageUserFilesModel, "uf", "uf.file_uuid = f.file_uuid")
                .where("uf.user_uuid = :userUUID", { userUUID: this.userUUID })
                .andWhere("f.is_delete = :isDelete", { isDelete: false })
                .andWhere("uf.is_delete = :isDelete", { isDelete: false })
                .getRawMany();

        const r: CloudStorageInfoFindFilesInfoReturn = new Map();

        result.forEach(({ fileUUID, directoryPath, fileName, fileSize, fileURL, resourceType }) => {
            r.set(fileUUID, {
                directoryPath,
                fileName,
                fileSize,
                fileURL,
                resourceType,
            });
        });

        return r;
    }

    public async assertFileOwnership(fileUUID: string): Promise<void> {
        const result = await cloudStorageUserFilesDAO.findOne(this.DBTransaction, ["id"], {
            file_uuid: fileUUID,
            user_uuid: this.userUUID,
        });

        if (!result) {
            throw new FError(ErrorCode.FileNotFound);
        }
    }
}
