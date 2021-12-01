import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { CloudStorageUserFilesDAO } from "../../../dao";
import { InsertResult } from "typeorm";

export class ServiceCloudStorageUserFiles {
    public constructor(private readonly userUUID: string) {}

    public async create(fileUUID: string, t?: EntityManager): Promise<InsertResult> {
        return CloudStorageUserFilesDAO(t).insert({
            user_uuid: this.userUUID,
            file_uuid: fileUUID,
        });
    }
}
