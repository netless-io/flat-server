import { createLoggerService } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { CloudStorageFilesModel } from "../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../model/cloudStorage/CloudStorageUserFiles";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { v4 } from "uuid";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";
import { FileResourceType } from "../../../model/cloudStorage/Constants";
import { calculateDirectoryMaxDeep, pathPrefixMatch, splitPath } from "./internal/utils/directory";
import { FilesInfo } from "./info.type";

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
            .andWhere("f.resource_type = :resourceType", {
                resourceType: FileResourceType.Directory,
            })
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
     * @param {string} parentDirectoryPath - parent directory (e.g. /a/b/c/)
     * @param {string} directoryName - will create directory name (e.g. new_dir)
     */
    public async create(parentDirectoryPath: string, directoryName: string): Promise<void> {
        const fullDirectoryPath = `${parentDirectoryPath}${directoryName}/`;

        if (fullDirectoryPath.length > 300) {
            this.logger.debug("directory is too long");
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        const hasParentDirectoryPath = await this.exists(parentDirectoryPath);
        if (!hasParentDirectoryPath) {
            this.logger.debug("parent directory does not exist");
            throw new FError(ErrorCode.DirectoryNotExists);
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
                directory_path: parentDirectoryPath,
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
     * @param {string} parentDirectoryPath - parent directory (e.g. /a/b/c/)
     * @param {string} oldDirectoryName - will rename directory name (e.g. old_dir)
     * @param {string} newDirectoryName - new directory name (e.g. new_dir)
     */
    public async rename(
        filesInfo: FilesInfo,
        directoryUUID: string,
        newDirectoryName: string,
    ): Promise<void> {
        const directoryInfo = filesInfo.get(directoryUUID)!;

        if (directoryInfo.fileName === newDirectoryName) {
            this.logger.debug("directory name is same");
            return;
        }

        const fullOldDirectoryPath = `${directoryInfo.directoryPath}${directoryInfo.fileName}/`;
        const fullNewDirectoryPath = `${directoryInfo.directoryPath}${newDirectoryName}/`;
        const subAndDir = pathPrefixMatch(filesInfo, fullOldDirectoryPath);
        const maxLength = calculateDirectoryMaxDeep(subAndDir, fullOldDirectoryPath);

        if (fullNewDirectoryPath.length + maxLength > 300) {
            this.logger.debug("directory is too long");
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        const hasNewDirectory = await this.exists(fullNewDirectoryPath);
        if (hasNewDirectory) {
            this.logger.debug("directory already exists");
            throw new FError(ErrorCode.DirectoryAlreadyExists);
        }

        await Promise.all([
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    directory_path: () =>
                        `REGEXP_REPLACE(directory_path, '^${fullOldDirectoryPath}', '${fullNewDirectoryPath}')`,
                },
                {
                    file_uuid: In(Array.from(subAndDir.keys())),
                },
            ),
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    file_name: newDirectoryName,
                },
                {
                    file_uuid: directoryUUID,
                },
            ),
        ]);
    }

    /**
     * move directory
     * /a/b/c/dir => /a/x/dir
     * @param {FilesInfoBasic} filesInfo - files info
     * @param {string} originDirectoryPath - origin directory path (e.g. /a/b/c/)
     * @param {string} targetDirectoryPath - target directory (e.g. /a/x/)
     * @param {string} directoryName - directory name (e.g. dir)
     */
    public async move(
        filesInfo: FilesInfo,
        targetDirectoryPath: string,
        directoryUUID: string,
    ): Promise<void> {
        const directoryInfo = filesInfo.get(directoryUUID)!;
        const directoryName = directoryInfo.fileName;
        const parentDirectoryPath = directoryInfo.directoryPath;

        const fullOriginDirectoryPath = `${parentDirectoryPath}${directoryName}/`;
        const fullTargetDirectoryPath = `${targetDirectoryPath}${directoryName}/`;

        if (await this.exists(fullTargetDirectoryPath)) {
            this.logger.debug("target file already exists");
            throw new FError(ErrorCode.DirectoryAlreadyExists);
        }

        const subFilesAndDir = pathPrefixMatch(filesInfo, fullOriginDirectoryPath);

        const originDirectoryDeep = calculateDirectoryMaxDeep(
            subFilesAndDir,
            fullOriginDirectoryPath,
        );

        if (originDirectoryDeep + fullTargetDirectoryPath.length > 300) {
            this.logger.debug("directory is too long");
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        await Promise.all([
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    directory_path: () =>
                        `REGEXP_REPLACE(directory_path, '^${fullOriginDirectoryPath}', '${fullTargetDirectoryPath}')`,
                },
                {
                    file_uuid: In(Array.from(subFilesAndDir.keys())),
                },
            ),
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    directory_path: targetDirectoryPath,
                },
                {
                    file_uuid: directoryUUID,
                },
            ),
        ]);
    }
}
