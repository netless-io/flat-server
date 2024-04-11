import { createLoggerService, parseError } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { cloudStorageFilesDAO } from "../../dao";
import { FilesInfo } from "./info.type";
import { FileResourceType, ossResourceType } from "../../../model/cloudStorage/Constants";
import path from "path";
import { useOnceService } from "../../service-locator";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

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

    public getFileResourceTypeByFileNameUseProjector(fileName: string): FileResourceType {
        const extname = path.extname(fileName).toLowerCase();
        switch (extname) {
            case ".pptx":
            case ".doc":
            case ".docx":
            case ".ppt":
            case ".pdf": {
                return FileResourceType.WhiteboardProjector;
            }
            case ".png":
            case ".jpg":
            case ".jpeg":
            case ".gif":
            case ".mp3":
            case ".mp4": {
                return FileResourceType.NormalResources;
            }
            default: {
                this.logger.warn("fileName extname is not preset", {
                    cloudStorageFile: {
                        fileName,
                    },
                });
                throw new FError(ErrorCode.ParamsCheckFailed);
            }
        }
    }

    public getFileResourceTypeByFileName(fileName: string): FileResourceType {
        const extname = path.extname(fileName).toLowerCase();
        switch (extname) {
            case ".pptx":
                return FileResourceType.WhiteboardProjector;
            case ".doc":
            case ".docx":
            case ".ppt":
            case ".pdf": {
                return FileResourceType.WhiteboardConvert;
            }
            case ".png":
            case ".jpg":
            case ".jpeg":
            case ".gif":
            case ".mp3":
            case ".mp4": {
                return FileResourceType.NormalResources;
            }
            default: {
                this.logger.warn("fileName extname is not preset", {
                    cloudStorageFile: {
                        fileName,
                    },
                });
                throw new FError(ErrorCode.ParamsCheckFailed);
            }
        }
    }
}
