import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";
import { CloudStorageInfoService } from "./info";
import { FileResourceType } from "../../../model/cloudStorage/Constants";
import { CloudStorageDirectoryService } from "./directory";
import { ErrorCode } from "../../../ErrorCode";
import { FError } from "../../../error/ControllerError";

export class CloudStorageRenameService {
    private readonly logger = createLoggerService<"cloudStorageRename">({
        serviceName: "cloudStorageRename",
        requestID: this.reqID,
    });

    constructor(
        private readonly reqID: string,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async rename(fileUUID: string, newName: string): Promise<void> {
        const cloudStorageInfoSvc = new CloudStorageInfoService(
            this.reqID,
            this.DBTransaction,
            this.userUUID,
        );

        const fileInfo = await cloudStorageInfoSvc.findFileInfo(fileUUID);

        if (!fileInfo) {
            this.logger.info("file not found");
            throw new FError(ErrorCode.FileNotFound);
        }

        if (fileInfo.resourceType === FileResourceType.Directory) {
            this.logger.debug("fileUUID is directory");
            await new CloudStorageDirectoryService(
                this.reqID,
                this.DBTransaction,
                this.userUUID,
            ).rename(fileInfo.directoryPath, fileInfo.fileName, newName);
        }
        // TODO: implement rename for file
    }
}
