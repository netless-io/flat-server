import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";
import { CloudStorageInfoService } from "./info";
import { CloudStorageDirectoryService } from "./directory";
import { ErrorCode } from "../../../ErrorCode";
import { FError } from "../../../error/ControllerError";
import { CloudStorageMoveConfig } from "./move.type";
import { CloudStorageFileService } from "./file";
import { clearUUIDs } from "./internal/utils/directory";

export class CloudStorageMoveService {
    private readonly logger = createLoggerService<"cloudStorageMove">({
        serviceName: "cloudStorageMove",
        requestID: this.reqID,
    });

    constructor(
        private readonly reqID: string,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async move(config: CloudStorageMoveConfig): Promise<void> {
        const cloudStorageInfoSVC = new CloudStorageInfoService(
            this.reqID,
            this.DBTransaction,
            this.userUUID,
        );

        const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

        const cloudStorageDirectorySVC = new CloudStorageDirectoryService(
            this.reqID,
            this.DBTransaction,
            this.userUUID,
        );

        const targetDirectoryPathExists = await cloudStorageDirectorySVC.exists(
            config.targetDirectoryPath,
        );
        if (!targetDirectoryPathExists) {
            this.logger.debug("target directory does not exist");
            throw new FError(ErrorCode.DirectoryNotExists);
        }

        const { files, dirs, originDirectoryPath } = clearUUIDs(filesInfo, config.uuids);

        if (originDirectoryPath === config.targetDirectoryPath) {
            return;
        }

        const cloudStorageFileSVC = new CloudStorageFileService(
            this.reqID,
            this.DBTransaction,
            this.userUUID,
        );

        const command: Array<Promise<any>> = [];

        command.push(
            cloudStorageFileSVC.move(files, originDirectoryPath, config.targetDirectoryPath),
        );

        dirs.forEach((_dir, directoryUUID) => {
            command.push(
                cloudStorageDirectorySVC.move(filesInfo, config.targetDirectoryPath, directoryUUID),
            );
        });

        await Promise.all(command);
    }
}
