import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";
import { CloudStorageInfoService } from "./info";
import { CloudStorageDirectoryService } from "./directory";
import { ErrorCode } from "../../../ErrorCode";
import { FError } from "../../../error/ControllerError";
import { CloudStorageMoveConfig } from "./move.type";
import { CloudStorageFileService } from "./file";
import { aggregationsFilesInfo } from "./internal/utils/directory";

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

        const data = aggregationsFilesInfo(filesInfo, config.uuids);

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

        const cloudStorageFileSVC = new CloudStorageFileService(
            this.reqID,
            this.DBTransaction,
            this.userUUID,
        );

        const command: Array<Promise<any>> = [];
        for (const item in data) {
            const { dir, files } = data[item];

            if (files.length > 0) {
                command.push(
                    cloudStorageFileSVC.move(filesInfo, item, config.targetDirectoryPath, files),
                );
            }

            for (const d of dir) {
                command.push(
                    cloudStorageDirectorySVC.move(filesInfo, item, config.targetDirectoryPath, d),
                );
            }
        }

        await Promise.all(command);
    }
}
