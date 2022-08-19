import { createLoggerService, parseError } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { cloudStorageFilesDAO } from "../../dao";
import { FilesInfo } from "./info.type";
import { ossResourceType } from "../../../model/cloudStorage/Constants";
import path from "path";
import { useOnceService } from "../../service-locator";

export class CloudStorageFileService {
    private readonly logger = createLoggerService<"cloudStorageFile">({
        serviceName: "cloudStorageFile",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
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

    public async rename(
        filesInfo: FilesInfo,
        fileUUID: string,
        newFileName: string,
    ): Promise<void> {
        const fileInfo = filesInfo.get(fileUUID)!;

        await cloudStorageFilesDAO.update(
            this.DBTransaction,
            {
                file_name: `${newFileName}${path.extname(fileInfo.fileName)}`,
            },
            {
                file_uuid: fileUUID,
            },
        );

        if (ossResourceType.includes(fileInfo.resourceType)) {
            const filePath = new URL(fileInfo.fileURL).pathname;

            const oss = useOnceService("oss", this.ids);
            oss.rename(filePath, newFileName).catch(error => {
                this.logger.warn("rename oss file failed", parseError(error));
            });
        }
    }
}
