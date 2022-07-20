import { CreateCloudStorageConfigs } from "./cloud-storage-configs";
import { CreateCloudStorageFiles } from "./cloud-storage-files";
import { CreateCloudStorageUserFiles } from "./cloud-storage-user-files";
import { v4 } from "uuid";

export class CreateCS {
    public static async createDirectory(
        userUUID: string,
        parentDirectoryPath = "/",
        directoryName = v4(),
    ) {
        await CreateCloudStorageConfigs.fixedUserUUID(userUUID);
        const fileInfo = await CreateCloudStorageFiles.createDirectory(
            parentDirectoryPath,
            directoryName,
        );
        await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileInfo.fileUUID);

        return {
            directoryName,
            fileUUID: fileInfo.fileUUID,
            directoryPath: `${parentDirectoryPath}${directoryName}/`,
        };
    }

    public static async createDirectories(userUUID: string, parentDirectoryPath = "/", count = 1) {
        const directoryNames = Array.from({ length: count }, () => v4());

        await CreateCloudStorageConfigs.fixedUserUUID(userUUID);

        const items = [];
        for (let i = 0; i < count; i++) {
            const result = await CreateCloudStorageFiles.createDirectory(
                parentDirectoryPath,
                directoryNames[i],
            );
            items.push(result);
        }

        const result = (await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(
            userUUID,
            items.map(i => i.fileUUID),
        )) as Array<{ userUUID: string; fileUUID: string }>;

        return result.map((item, index) => ({
            directoryName: directoryNames[index],
            fileUUID: item.fileUUID,
            directoryPath: `${parentDirectoryPath}${directoryNames[index]}/`,
        }));
    }

    public static async createFile(userUUID: string, parentDirectoryPath = "/", fileName = v4()) {
        await CreateCloudStorageConfigs.fixedUserUUID(userUUID);

        const fileInfo = await CreateCloudStorageFiles.fixedDirectoryPath(
            parentDirectoryPath,
            fileName,
        );

        await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileInfo.fileUUID);

        return {
            fileName,
            fileUUID: fileInfo.fileUUID,
            filePath: `${parentDirectoryPath}${fileName}`,
        };
    }

    public static async createFiles(userUUID: string, parentDirectoryPath = "/", count = 1) {
        const fileNames = Array.from({ length: count }, () => v4());

        await CreateCloudStorageConfigs.fixedUserUUID(userUUID);

        const items = [];
        for (let i = 0; i < count; i++) {
            const result = await CreateCloudStorageFiles.fixedDirectoryPath(
                parentDirectoryPath,
                fileNames[i],
            );
            items.push(result);
        }

        const result = (await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(
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
