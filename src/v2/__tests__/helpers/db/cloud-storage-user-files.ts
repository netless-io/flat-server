import { v4 } from "uuid";
import { CloudStorageUserFilesModel } from "../../../../model/cloudStorage/CloudStorageUserFiles";
import { EntityManager } from "typeorm";

export class CreateCloudStorageUserFiles {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: { userUUID: string; fileUUID: string }) {
        await this.t.getRepository(CloudStorageUserFilesModel).insert({
            user_uuid: info.userUUID,
            file_uuid: info.fileUUID,
        });
    }

    public async fixedFileUUID(fileUUID: string | string[]) {
        return this.fixedUserUUIDAndFileUUID(v4(), fileUUID);
    }

    public async fixedUserUUIDAndFileUUID(userUUID: string, fileUUID: string | string[]) {
        if (typeof fileUUID === "string") {
            const info = {
                userUUID,
                fileUUID,
            };
            await this.full(info);

            return info;
        }

        const infos = fileUUID.map(item => ({
            user_uuid: userUUID,
            file_uuid: item,
        }));

        await this.t.getRepository(CloudStorageUserFilesModel).insert(infos);

        return fileUUID.map(item => ({
            userUUID,
            fileUUID: item,
        }));
    }
}
