import { createLoggerService, parseError } from "../../../logger";
import { EntityManager, In } from "typeorm";
import { CloudStorageDeleteConfig } from "./delete.type";
import { CloudStorageInfoService } from "./info";
import { calculateFilesSize, clearUUIDs, pathPrefixMatch } from "./internal/utils/directory";
import { ossResourceType } from "../../../model/cloudStorage/Constants";
import { cloudStorageConfigsDAO, cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";
import { FilesInfo } from "./info.type";
import { useOnceService } from "../../service-locator";

export class CloudStorageDeleteService {
    private readonly logger = createLoggerService<"cloudStorageDelete">({
        serviceName: "cloudStorageDelete",
        ids: this.ids,
    });

    private readonly oss = useOnceService("oss", this.ids);

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async delete(config: CloudStorageDeleteConfig): Promise<void> {
        const cloudStorageInfoSVC = new CloudStorageInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

        const { files, dirs } = clearUUIDs(filesInfo, config.uuids);

        const deleteFiles = files;

        dirs.forEach((_item, dirUUID) => {
            const data = CloudStorageDeleteService.getAllFilesAndDirs(filesInfo, dirUUID);
            data.forEach((info, uuid) => deleteFiles.set(uuid, info));
        });

        if (deleteFiles.size === 0) {
            this.logger.debug("delete file is empty");
            return;
        }

        const uuidsArray = Array.from(deleteFiles.keys());

        this.logger.debug("delete file", {
            cloudStorageDelete: {
                uuids: uuidsArray.join(", "),
            },
        });

        const commands: Promise<void>[] = [
            cloudStorageFilesDAO.delete(this.DBTransaction, {
                file_uuid: In(uuidsArray),
            }),
            cloudStorageUserFilesDAO.delete(this.DBTransaction, {
                file_uuid: In(uuidsArray),
                user_uuid: this.userUUID,
            }),
        ];

        const deleteFileSize = calculateFilesSize(deleteFiles);

        if (deleteFileSize > 0) {
            commands.push(
                cloudStorageConfigsDAO.update(
                    this.DBTransaction,
                    {
                        total_usage: () => `total_usage - ${deleteFileSize}`,
                    },
                    {
                        user_uuid: this.userUUID,
                    },
                ),
            );
        }

        await Promise.all(commands);

        this.oss
            .remove(CloudStorageDeleteService.getFilesPathnameInURL(filesInfo, uuidsArray))
            .catch(error => {
                this.logger.warn("delete oss file error", parseError(error));
            });
    }

    public static getAllFilesAndDirs(filesInfo: FilesInfo, directoryUUID: string): FilesInfo {
        const directoryInfo = filesInfo.get(directoryUUID)!;

        const fullDirectoryPath = `${directoryInfo.directoryPath}${directoryInfo.fileName}/`;

        const result = pathPrefixMatch(filesInfo, fullDirectoryPath);

        result.set(directoryUUID, directoryInfo);

        // all files and dir uuid contained in this directory
        return result;
    }

    public static getFilesPathnameInURL(files: FilesInfo, uuids: string[]): string[] {
        const result: string[] = [];

        uuids.forEach(uuid => {
            const fileInfo = files.get(uuid)!;

            if (ossResourceType.includes(fileInfo.resourceType)) {
                const url = new URL(fileInfo.fileURL);
                result.push(url.pathname);
            }
        });

        return result;
    }
}
