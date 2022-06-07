import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { CloudStorageFilesDAO } from "../../../dao";
import { InsertResult } from "typeorm";
import { FilePayload } from "../../../model/cloudStorage/Types";
import { FileResourceType } from "../../../model/cloudStorage/Constants";

export class ServiceCloudStorageFiles {
    public constructor() {}

    public async create(
        data: {
            fileName: string;
            fileSize: number;
            fileURL: string;
            fileUUID: string;
            payload: FilePayload;
            resourceType: FileResourceType;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { fileName, fileSize, fileURL, fileUUID, payload, resourceType } = data;
        return CloudStorageFilesDAO(t).insert({
            file_name: fileName,
            file_size: fileSize,
            file_url: fileURL,
            file_uuid: fileUUID,
            payload,
            resource_type: resourceType,
        });
    }
}
