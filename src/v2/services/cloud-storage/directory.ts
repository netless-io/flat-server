import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";
import { CloudStorageFilesModel } from "../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../model/cloudStorage/CloudStorageUserFiles";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { v4 } from "uuid";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";
import { FileResourceType } from "../../../model/cloudStorage/Constants";

export class CloudStorageDirectoryService {
    private readonly logger = createLoggerService<"cloudStorageDirectory">({
        serviceName: "cloudStorageDirectory",
        requestID: this.reqID,
    });

    constructor(
        private readonly reqID: string,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

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
            cloudStorageDirectory: {
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
