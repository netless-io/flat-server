import { cloudStorageConfigsDAO, cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";
import { CloudStorageFilesModel } from "../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../model/cloudStorage/CloudStorageUserFiles";
import {
    CloudStorageInfoList,
    CloudStorageInfoListParamsConfig,
    CloudStorageInfoListReturn,
    ListFilesAndTotalUsageByUserUUIDReturn,
} from "./info.type";
import { createLoggerService } from "../../../logger";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import { FileResourceType } from "../../../model/cloudStorage/Constants";

export class CloudStorageInfoService {
    private readonly logger = createLoggerService<"cloudStorageInfo">({
        serviceName: "cloudStorageInfo",
        requestID: this.reqID,
    });

    constructor(
        private readonly reqID: string,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async totalUsage(): Promise<number> {
        const result = await cloudStorageConfigsDAO.findOne(this.DBTransaction, "total_usage", {
            user_uuid: this.userUUID,
        });

        const totalUsage = Number(result.total_usage) || 0;
        this.logger.debug(`totalUsage is: ${totalUsage}`);

        return Number(result.total_usage) || 0;
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
                    payload,
                    resourceType,
                    createAt: createAt.valueOf(),
                };
            },
        );

        this.logger.debug(`list result: ${JSON.stringify(r, null, 2)}`);
        return r;
    }

    public async listFilesAndTotalUsageByUserUUID(
        config: CloudStorageInfoListParamsConfig,
    ): Promise<ListFilesAndTotalUsageByUserUUIDReturn> {
        return {
            totalUsage: await this.totalUsage(),
            items: await this.list(config),
            // directory path max length is 300
            canCreateDirectory: config.directoryPath.length < 299,
        };
    }

    public async existsDirectory(directoryPath: string): Promise<boolean> {
        if (directoryPath === "/") {
            return true;
        }

        const result = await this.DBTransaction.createQueryBuilder(CloudStorageFilesModel, "f")
            .addSelect("f.directory_path", "directoryPath")
            .innerJoin(CloudStorageUserFilesModel, "uf", "uf.file_uuid = f.file_uuid")
            .where("uf.user_uuid = :userUUID", { userUUID: this.userUUID })
            .andWhere("f.file_name = :fileName", { fileName: `${directoryPath}.keep` })
            .andWhere("f.is_delete = :isDelete", { isDelete: false })
            .andWhere("uf.is_delete = :isDelete", { isDelete: false })
            .getRawOne();

        const exists = !!result;

        this.logger.debug("directory exists result", {
            cloudStorageInfo: {
                directoryPath: directoryPath,
                directoryExists: exists,
            },
        });

        return exists;
    }

    /**
     * create directory
     * @param {string} parentDirectory - parent directory (e.g. /a/b/c/)
     * @param {string} directoryName - will create directory name (e.g. new_dir)
     */
    public async createDirectory(parentDirectory: string, directoryName: string): Promise<void> {
        const fullDirectoryPath = `${parentDirectory}${directoryName}/`;

        if (fullDirectoryPath.length > 300) {
            this.logger.debug("directory is too long");
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        const hasParentDirectory = await this.existsDirectory(parentDirectory);
        if (!hasParentDirectory) {
            this.logger.debug("parent directory does not exist");
            throw new FError(ErrorCode.ParentDirectoryNotExists);
        }

        const hasDirectory = await this.existsDirectory(fullDirectoryPath);
        if (hasDirectory) {
            this.logger.debug("directory already exists");
            throw new FError(ErrorCode.DirectoryAlreadyExists);
        }

        const fileUUID = v4();

        await Promise.all([
            cloudStorageFilesDAO.insert(this.DBTransaction, {
                file_name: `${fullDirectoryPath}.keep`,
                file_uuid: fileUUID,
                directory_path: parentDirectory,
                file_size: 0,
                file_url: `file://${fullDirectoryPath}.keep`,
                resource_type: FileResourceType.Directory,
                payload: {},
            }),
            cloudStorageUserFilesDAO.insert(this.DBTransaction, {
                user_uuid: this.userUUID,
                file_uuid: fileUUID,
            }),
        ]);
    }
}
