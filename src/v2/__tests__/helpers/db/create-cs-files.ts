import { CreateCloudStorageConfigs } from "./cloud-storage-configs";
import { CreateCloudStorageFiles } from "./cloud-storage-files";
import { CreateCloudStorageUserFiles } from "./cloud-storage-user-files";
import { v4 } from "uuid";

export class CreateCS {
    public static async createDirectory(userUUID: string, parentDirectoryPath = "/", count = 1) {
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
