import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageUserFilesModel } from "../../../../model/cloudStorage/CloudStorageUserFiles";

export class CreateCloudStorageUserFiles {
    public static async full(info: { userUUID: string; fileUUID: string }) {
        await dataSource.getRepository(CloudStorageUserFilesModel).insert({
            user_uuid: info.userUUID,
            file_uuid: info.fileUUID,
        });
    }

    public static async fixedFileUUID(fileUUID: string | string[]) {
        return CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(v4(), fileUUID);
    }

    public static async fixedUserUUIDAndFileUUID(userUUID: string, fileUUID: string | string[]) {
        if (typeof fileUUID === "string") {
            const info = {
                userUUID,
                fileUUID,
            };
            await CreateCloudStorageUserFiles.full(info);

            return info;
        }

        const infos = fileUUID.map(item => ({
            user_uuid: userUUID,
            file_uuid: item,
        }));

        await dataSource.getRepository(CloudStorageUserFilesModel).insert(infos);

        return fileUUID.map(item => ({
            userUUID,
            fileUUID: item,
        }));
    }
}
