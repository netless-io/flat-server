import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { CloudStorageConfigsDAO } from "../../../dao";
import { InsertResult } from "typeorm";

export class ServiceCloudStorageConfigs {
    public constructor(private readonly userUUID: string) {}

    public async createOrUpdate(
        totalUsage: number | string,
        t?: EntityManager,
    ): Promise<InsertResult> {
        return CloudStorageConfigsDAO(t).insert(
            {
                user_uuid: this.userUUID,
                total_usage: String(totalUsage),
            },
            {
                orUpdate: {
                    total_usage: String(totalUsage),
                },
            },
        );
    }

    public async totalUsage(): Promise<number> {
        const result = await CloudStorageConfigsDAO().findOne(["total_usage"], {
            user_uuid: this.userUUID,
        });

        return Number(result?.total_usage || 0);
    }
}
