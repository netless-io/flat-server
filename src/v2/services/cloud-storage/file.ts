import { createLoggerService } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { cloudStorageFilesDAO } from "../../dao";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { FilesInfo } from "./info.type";

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
        files: FilesInfo,
        originDirectoryPath: string,
        targetDirectoryPath: string,
    ): Promise<void> {
        if (originDirectoryPath === targetDirectoryPath) {
            return;
        }

        files.forEach(({ fileName }, fileUUID) => {
            if (`${targetDirectoryPath}${fileName}`.length > 300) {
                this.logger.info("file path too long", {
                    cloudStorageFile: {
                        fileUUID,
                        fileName,
                        originDirectoryPath,
                        targetDirectoryPath,
                    },
                });
                throw new FError(ErrorCode.ParamsCheckFailed);
            }
        });

        const uuids = Array.from(files.keys());
        await cloudStorageFilesDAO.update(
            this.DBTransaction,
            {
                directory_path: targetDirectoryPath,
            },
            {
                file_uuid: In(uuids),
                directory_path: originDirectoryPath,
            },
        );

        this.logger.debug("move file", {
            cloudStorageFile: {
                originDirectoryPath,
                targetDirectoryPath,
                filesUUID: uuids.join(", "),
            },
        });
    }
}
