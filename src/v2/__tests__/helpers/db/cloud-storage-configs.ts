import { CloudStorageConfigsModel } from "../../../../model/cloudStorage/CloudStorageConfigs";
import { v4 } from "uuid";
import { EntityManager } from "typeorm";

export class CreateCloudStorageConfigs {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: { userUUID: string; totalUsage: number }) {
        const hasUserUUID = await this.t.findOne(CloudStorageConfigsModel, {
            where: {
                user_uuid: info.userUUID,
            },
        });

        if (!hasUserUUID) {
            await this.t.insert(CloudStorageConfigsModel, {
                user_uuid: info.userUUID,
                total_usage: String(info.totalUsage),
            });
        }
    }

    public async quick() {
        const info = {
            userUUID: v4(),
            totalUsage: Math.ceil(Math.random() * 100000),
        };

        await this.full(info);

        return info;
    }

    public async fixedTotalUsage(totalUsage: number) {
        const info = {
            userUUID: v4(),
            totalUsage,
        };

        await this.full(info);

        return info;
    }

    public async fixedUserUUID(userUUID: string) {
        const info = {
            userUUID,
            totalUsage: Math.ceil(Math.random() * 100000),
        };

        await this.full(info);

        return info;
    }
}
