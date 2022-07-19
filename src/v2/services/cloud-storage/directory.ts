import { createLoggerService } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { CloudStorageFilesModel } from "../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../model/cloudStorage/CloudStorageUserFiles";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { v4 } from "uuid";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";
import { FileResourceType } from "../../../model/cloudStorage/Constants";
import {
    calculateDirectoryMaxDeep,
    filesSeparator,
    pathPrefixMatch,
    splitPath,
} from "./internal/utils/directory";
import { CloudStorageInfoService } from "./info";
import { FilesInfoBasic } from "./directory.type";

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
        parentDirectoryPath: string,
        oldDirectoryName: string,
        newDirectoryName: string,
    ): Promise<void> {
        if (oldDirectoryName === newDirectoryName) {
            this.logger.debug("directory name is same");
            return;
        }

        const fullNewDirectoryPath = `${parentDirectoryPath}${newDirectoryName}/`;
        if (fullNewDirectoryPath.length > 300) {
            this.logger.debug("directory is too long");
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        const fullOldDirectoryPath = `${parentDirectoryPath}${oldDirectoryName}/`;

        const hasOldDirectory = await this.exists(fullOldDirectoryPath);
        if (!hasOldDirectory) {
            this.logger.debug("directory does not exist");
            throw new FError(ErrorCode.DirectoryNotExists);
        }

        const hasNewDirectory = await this.exists(fullNewDirectoryPath);
        if (hasNewDirectory) {
            this.logger.debug("directory already exists");
            throw new FError(ErrorCode.DirectoryAlreadyExists);
        }

        const cloudStorageInfoSVC = new CloudStorageInfoService(
            this.reqID,
            this.DBTransaction,
            this.userUUID,
        );
        const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

        const { currentDirectoryUUID, subFilesAndDirUUID } = filesSeparator(
            filesInfo,
            parentDirectoryPath,
            oldDirectoryName,
        );

        await Promise.all([
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    directory_path: () =>
                        `REGEXP_REPLACE(directory_path, '^${fullOldDirectoryPath}', '${fullNewDirectoryPath}')`,
                },
                {
                    file_uuid: In(subFilesAndDirUUID),
                },
            ),
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    file_name: newDirectoryName,
                },
                {
                    file_uuid: currentDirectoryUUID,
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
        filesInfo: FilesInfoBasic[],
        originDirectoryPath: string,
        targetDirectoryPath: string,
        directoryName: string,
    ): Promise<void> {
        if (originDirectoryPath === targetDirectoryPath) {
            return;
        }
        const fullOriginDirectoryPath = `${originDirectoryPath}${directoryName}/`;
        const fullTargetDirectoryPath = `${targetDirectoryPath}${directoryName}/`;

        const [e1, e2] = await Promise.all([
            this.exists(fullOriginDirectoryPath),
            this.exists(fullTargetDirectoryPath),
        ]);

        if (!e1) {
            this.logger.debug("origin directory does not exist");
            throw new FError(ErrorCode.DirectoryNotExists);
        }
        if (e2) {
            this.logger.debug("target file already exists");
            throw new FError(ErrorCode.DirectoryAlreadyExists);
        }

        const originDirectoryDeep = calculateDirectoryMaxDeep(
            pathPrefixMatch(filesInfo, fullOriginDirectoryPath),
            originDirectoryPath,
            directoryName,
        );

        if (originDirectoryDeep + targetDirectoryPath.length >= 300) {
            this.logger.debug("directory is too long");
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        const { currentDirectoryUUID, subFilesAndDirUUID } = filesSeparator(
            filesInfo,
            originDirectoryPath,
            directoryName,
        );

        await Promise.all([
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    directory_path: () =>
                        `REGEXP_REPLACE(directory_path, '^${fullOriginDirectoryPath}', '${fullTargetDirectoryPath}')`,
                },
                {
                    file_uuid: In(subFilesAndDirUUID),
                },
            ),
            cloudStorageFilesDAO.update(
                this.DBTransaction,
                {
                    directory_path: targetDirectoryPath,
                },
                {
                    file_uuid: currentDirectoryUUID,
                },
            ),
        ]);
    }
}
