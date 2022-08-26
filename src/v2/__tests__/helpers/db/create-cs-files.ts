import { CreateCloudStorageConfigs } from "./cloud-storage-configs";
import { CreateCloudStorageFiles } from "./cloud-storage-files";
import { CreateCloudStorageUserFiles } from "./cloud-storage-user-files";
import { v4 } from "uuid";
import { EntityManager } from "typeorm";

export class CreateCS {
    private createCloudStorageConfigs = new CreateCloudStorageConfigs(this.t);
    private createCloudStorageFiles = new CreateCloudStorageFiles(this.t);
    private createCloudStorageUserFiles = new CreateCloudStorageUserFiles(this.t);

    public constructor(private readonly t: EntityManager) {}

    public async createDirectory(
        userUUID: string,
        parentDirectoryPath = "/",
        directoryName = v4(),
    ) {
        await this.createCloudStorageConfigs.fixedUserUUID(userUUID);
        const fileInfo = await this.createCloudStorageFiles.createDirectory(
            parentDirectoryPath,
            directoryName,
        );
        await this.createCloudStorageUserFiles.fixedUserUUIDAndFileUUID(
            userUUID,
            fileInfo.fileUUID,
        );

        return {
            directoryName,
            fileUUID: fileInfo.fileUUID,
            directoryPath: `${parentDirectoryPath}${directoryName}/`,
        };
    }

    public async createDirectories(userUUID: string, parentDirectoryPath = "/", count = 1) {
        const directoryNames = Array.from({ length: count }, () => v4());

        await this.createCloudStorageConfigs.fixedUserUUID(userUUID);

        const items = [];
        for (let i = 0; i < count; i++) {
            const result = await this.createCloudStorageFiles.createDirectory(
                parentDirectoryPath,
                directoryNames[i],
            );
            items.push(result);
        }

        const result = (await this.createCloudStorageUserFiles.fixedUserUUIDAndFileUUID(
            userUUID,
            items.map(i => i.fileUUID),
        )) as Array<{ userUUID: string; fileUUID: string }>;

        return result.map((item, index) => ({
            directoryName: directoryNames[index],
            fileUUID: item.fileUUID,
            directoryPath: `${parentDirectoryPath}${directoryNames[index]}/`,
        }));
    }

    public async createFile(userUUID: string, parentDirectoryPath = "/", fileName = v4()) {
        await this.createCloudStorageConfigs.fixedUserUUID(userUUID);

        const fileInfo = await this.createCloudStorageFiles.fixedDirectoryPath(
            parentDirectoryPath,
            fileName,
        );

        await this.createCloudStorageUserFiles.fixedUserUUIDAndFileUUID(
            userUUID,
            fileInfo.fileUUID,
        );

        return {
            fileName,
            fileUUID: fileInfo.fileUUID,
            fileURL: fileInfo.fileURL,
            resourceType: fileInfo.resourceType,
            payload: fileInfo.payload,
            filePath: `${parentDirectoryPath}${fileName}`,
        };
    }

    public async createFiles(userUUID: string, parentDirectoryPath = "/", count = 1) {
        const fileNames = Array.from({ length: count }, () => v4());

        await this.createCloudStorageConfigs.fixedUserUUID(userUUID);

        const items = [];
        for (let i = 0; i < count; i++) {
            const result = await this.createCloudStorageFiles.fixedDirectoryPath(
                parentDirectoryPath,
                fileNames[i],
            );
            items.push(result);
        }

        const result = (await this.createCloudStorageUserFiles.fixedUserUUIDAndFileUUID(
            userUUID,
            items.map(i => i.fileUUID),
        )) as Array<{ userUUID: string; fileUUID: string }>;

        return result.map((item, index) => ({
            fileName: fileNames[index],
            fileUUID: item.fileUUID,
            filePath: `${parentDirectoryPath}${fileNames[index]}`,
        }));
    }
}
