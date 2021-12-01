import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { CloudStorageFilesDAO } from "../../../dao";
import { InsertResult } from "typeorm";
import { Region } from "../../../constants/Project";

export class ServiceCloudStorageFiles {
    public constructor() {}

    public async create(
        data: {
            fileName: string;
            fileSize: number;
            fileURL: string;
            fileUUID: string;
            region: Region;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { fileName, fileSize, fileURL, fileUUID, region } = data;
        return CloudStorageFilesDAO(t).insert({
            file_name: fileName,
            file_size: fileSize,
            region: region,
            file_url: fileURL,
            file_uuid: fileUUID,
        });
    }
}
