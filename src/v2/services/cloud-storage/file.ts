import { createLoggerService } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { cloudStorageFilesDAO } from "../../dao";
import { FilesInfoBasic } from "./directory.type";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class CloudStorageFileService {
    private readonly logger = createLoggerService<"cloudStorageFile">({
        serviceName: "cloudStorageFile",
        requestID: this.reqID,
    });

    constructor(
        private readonly reqID: string,
        private readonly DBTransaction: EntityManager,
        // @ts-ignore
        private readonly userUUID: string,
    ) {}

    public async move(
        filesInfo: FilesInfoBasic[],
        originDirectoryPath: string,
        targetDirectoryPath: string,
        filesUUID: string[],
    ): Promise<void> {
        if (originDirectoryPath === targetDirectoryPath) {
            return;
        }

        for (const item of filesInfo) {
            if (`${targetDirectoryPath}${item.fileName}`.length > 300) {
                this.logger.info("file path too long", {
                    cloudStorageFile: {
                        fileUUID: item.fileUUID,
                        fileName: item.fileName,
                        originDirectoryPath,
                        targetDirectoryPath,
                    },
                });
                throw new FError(ErrorCode.ParamsCheckFailed);
            }
        }

        await cloudStorageFilesDAO.update(
            this.DBTransaction,
            {
                directory_path: targetDirectoryPath,
            },
            {
                file_uuid: In(filesUUID),
                directory_path: originDirectoryPath,
            },
        );

        this.logger.debug("move file", {
            cloudStorageFile: {
                originDirectoryPath,
                targetDirectoryPath,
                filesUUID: filesUUID.join(", "),
            },
        });
    }
}
