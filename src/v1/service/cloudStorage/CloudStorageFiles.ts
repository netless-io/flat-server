import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { CloudStorageFilesDAO } from "../../../dao";
import { InsertResult } from "typeorm";
import { FilePayload } from "../../../model/cloudStorage/Types";

export class ServiceCloudStorageFiles {
    public constructor() {}

    public async create(
        data: {
            fileName: string;
            fileSize: number;
            fileURL: string;
            fileUUID: string;
            payload: FilePayload;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { fileName, fileSize, fileURL, fileUUID, payload } = data;
        return CloudStorageFilesDAO(t).insert({
            file_name: fileName,
            file_size: fileSize,
            file_url: fileURL,
            file_uuid: fileUUID,
            payload,
        });
    }
}
