import { createLoggerService } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { cloudStorageFilesDAO } from "../../dao";
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
        private readonly _userUUID: string,
    ) {}

    public async move(
        files: FilesInfo,
        originParentDirectoryPath: string,
        targetDirectoryPath: string,
    ): Promise<void> {
        const uuids = Array.from(files.keys());
        await cloudStorageFilesDAO.update(
            this.DBTransaction,
            {
                directory_path: targetDirectoryPath,
            },
            {
                file_uuid: In(uuids),
                directory_path: originParentDirectoryPath,
            },
        );

        this.logger.debug("move file", {
            cloudStorageFile: {
                originParentDirectoryPath,
                targetDirectoryPath,
                filesUUID: uuids.join(", "),
            },
        });
    }
}
