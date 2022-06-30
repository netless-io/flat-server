import { cloudStorageConfigsDAO } from "../../dao";
import { dataSource } from "../../../thirdPartyService/TypeORMService";
import { CloudStorageFilesModel } from "../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../model/cloudStorage/CloudStorageUserFiles";
import {
    CloudStorageInfoList,
    CloudStorageInfoListParamsConfig,
    CloudStorageInfoListReturn,
    ListFilesAndTotalUsageByUserUUIDReturn,
} from "./info.type";

class CloudStorageStaticInfo {
    public static async totalUsage(userUUID: string): Promise<number> {
        const result = await cloudStorageConfigsDAO.findOne("total_usage", {
            user_uuid: userUUID,
        });

        return Number(result.total_usage) || 0;
    }

    public static async list(
        userUUID: string,
        config: CloudStorageInfoListParamsConfig,
    ): Promise<CloudStorageInfoListReturn[]> {
        const result: CloudStorageInfoList[] = await dataSource
            .createQueryBuilder(CloudStorageFilesModel, "f")
            .addSelect("f.file_uuid", "fileUUID")
            .addSelect("f.file_name", "fileName")
            .addSelect("f.file_size", "fileSize")
            .addSelect("f.file_url", "fileURL")
            .addSelect("f.created_at", "createAt")
            .addSelect("f.payload", "payload")
            .addSelect("f.resource_type", "resourceType")
            .innerJoin(CloudStorageUserFilesModel, "uf", "uf.file_uuid = f.file_uuid")
            .where("uf.user_uuid = :userUUID", { userUUID })
            .andWhere("uf.is_delete = :isDelete", { isDelete: false })
            .andWhere("f.is_delete = :isDelete", { isDelete: false })
            .orderBy("f.created_at", config.order)
            .offset((config.page - 1) * config.size)
            .limit(config.size)
            .getRawMany();

        return result.map(
            ({ fileUUID, fileName, fileSize, fileURL, createAt, resourceType, payload }) => {
                return {
                    fileUUID,
                    fileName,
                    fileSize,
                    fileURL,
                    payload,
                    resourceType,
                    createAt: createAt.valueOf(),
                };
            },
        );
    }

    public static async listFilesAndTotalUsageByUserUUID(
        userUUID: string,
        config: CloudStorageInfoListParamsConfig,
    ): Promise<ListFilesAndTotalUsageByUserUUIDReturn> {
        const totalUsage = await CloudStorageStaticInfo.totalUsage(userUUID);
        const files = await CloudStorageStaticInfo.list(userUUID, config);

        return {
            totalUsage,
            files,
        };
    }
}

export class CloudStorageInfoService extends CloudStorageStaticInfo {
    constructor(private readonly userUUID: string) {
        super();
    }

    public async totalUsage(): Promise<number> {
        return await CloudStorageInfoService.totalUsage(this.userUUID);
    }

    public async list(
        config: CloudStorageInfoListParamsConfig,
    ): Promise<CloudStorageInfoListReturn[]> {
        return await CloudStorageInfoService.list(this.userUUID, config);
    }

    public async listFilesAndTotalUsageByUserUUID(
        config: CloudStorageInfoListParamsConfig,
    ): Promise<ListFilesAndTotalUsageByUserUUIDReturn> {
        return CloudStorageInfoService.listFilesAndTotalUsageByUserUUID(this.userUUID, config);
    }
}
