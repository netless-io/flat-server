import { createLoggerService } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { CloudStorageFilesModel } from "../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../model/cloudStorage/CloudStorageUserFiles";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { v4 } from "uuid";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";
import { FileResourceType } from "../../../model/cloudStorage/Constants";
import { splitPath } from "./internal/utils/directory";
import { CloudStorageInfoService } from "./info";

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

    public async exists(directoryPath: string): Promise<boolean> {
        if (directoryPath === "/") {
            return true;
        }

        const { parentDirectoryPath, directoryName } = splitPath(directoryPath);

        const result = await this.DBTransaction.createQueryBuilder(CloudStorageFilesModel, "f")
            .addSelect("f.directory_path", "directoryPath")
            .innerJoin(CloudStorageUserFilesModel, "uf", "uf.file_uuid = f.file_uuid")
            .where("uf.user_uuid = :userUUID", { userUUID: this.userUUID })
            .andWhere("f.file_name = :fileName", { fileName: directoryName })
            .andWhere("f.directory_path = :directoryPath", { directoryPath: parentDirectoryPath })
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
    public async create(parentDirectory: string, directoryName: string): Promise<void> {
        const fullDirectoryPath = `${parentDirectory}${directoryName}/`;

        if (fullDirectoryPath.length > 300) {
            this.logger.debug("directory is too long");
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        const hasParentDirectory = await this.exists(parentDirectory);
        if (!hasParentDirectory) {
            this.logger.debug("parent directory does not exist");
            throw new FError(ErrorCode.ParentDirectoryNotExists);
        }

        const hasDirectory = await this.exists(fullDirectoryPath);
        if (hasDirectory) {
            this.logger.debug("directory already exists");
            throw new FError(ErrorCode.DirectoryAlreadyExists);
        }

        const fileUUID = v4();

        await Promise.all([
            cloudStorageFilesDAO.insert(this.DBTransaction, {
                file_name: directoryName,
                file_uuid: fileUUID,
                directory_path: parentDirectory,
                file_size: 0,
                file_url: `file://${directoryName}`,
                resource_type: FileResourceType.Directory,
                payload: {},
            }),
            cloudStorageUserFilesDAO.insert(this.DBTransaction, {
                user_uuid: this.userUUID,
                file_uuid: fileUUID,
            }),
        ]);
    }

    /**
     * rename directory
     * /a/b/c/old_dir -> /a/b/c/new_dir
     * @param {string} parentDirectory - parent directory (e.g. /a/b/c/)
     * @param {string} oldDirectoryName - will rename directory name (e.g. old_dir)
     * @param {string} newDirectoryName - new directory name (e.g. new_dir)
     */
    public async rename(
        parentDirectory: string,
        oldDirectoryName: string,
        newDirectoryName: string,
    ): Promise<void> {
        if (oldDirectoryName === newDirectoryName) {
            this.logger.debug("directory name is same");
            return;
        }

        const fullNewDirectoryPath = `${parentDirectory}${newDirectoryName}/`;
        if (fullNewDirectoryPath.length > 300) {
            this.logger.debug("directory is too long");
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        const fullOldDirectoryPath = `${parentDirectory}${oldDirectoryName}/`;

        const hasOldDirectory = await this.exists(fullOldDirectoryPath);
        if (!hasOldDirectory) {
            this.logger.debug("directory does not exist");
            throw new FError(ErrorCode.ParentDirectoryNotExists);
        }

        const hasNewDirectory = await this.exists(fullNewDirectoryPath);
        if (hasNewDirectory) {
            this.logger.debug("directory already exists");
            throw new FError(ErrorCode.DirectoryAlreadyExists);
        }

        const cloudStorageInfoSvc = new CloudStorageInfoService(
            this.reqID,
            this.DBTransaction,
            this.userUUID,
        );

        const fileUUIDsByUser = await cloudStorageInfoSvc.findFileUUIDs();

        const fileUUIDsByNotParentDirectory: string[] = [];
        let fileUUIDByParentDirectory = "";

        fileUUIDsByUser.forEach(item => {
            if (item.directoryPath !== parentDirectory) {
                fileUUIDsByNotParentDirectory.push(item.fileUUID);
            } else {
                fileUUIDByParentDirectory = item.fileUUID;
            }
        });

        await Promise.all([
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    directory_path: () =>
                        `REGEXP_REPLACE(directory_path, '^${fullOldDirectoryPath}', '${fullNewDirectoryPath}')`,
                },
                {
                    file_uuid: In(fileUUIDsByNotParentDirectory),
                },
            ),
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    file_name: newDirectoryName,
                },
                {
                    file_uuid: fileUUIDByParentDirectory,
                },
            ),
        ]);
    }
}
