import { cloudStorageConfigsDAO } from "../../dao";
import { CloudStorageFilesModel } from "../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../model/cloudStorage/CloudStorageUserFiles";
import {
    CloudStorageInfoList,
    CloudStorageInfoListParamsConfig,
    CloudStorageInfoListReturn,
    ListFilesAndTotalUsageByUserUUIDReturn,
} from "./info.type";
import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";

export class CloudStorageInfoService {
    private readonly logger = createLoggerService<"cloudStorageInfo">({
        serviceName: "cloudStorageInfo",
        requestID: this.reqID,
    });

    constructor(
        private readonly reqID: string,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async totalUsage(): Promise<number> {
        const result = await cloudStorageConfigsDAO.findOne(this.DBTransaction, "total_usage", {
            user_uuid: this.userUUID,
        });

        const totalUsage = Number(result.total_usage) || 0;
        this.logger.debug(`totalUsage is: ${totalUsage}`);

        return Number(result.total_usage) || 0;
    }

    public async list(
        config: CloudStorageInfoListParamsConfig,
    ): Promise<CloudStorageInfoListReturn[]> {
        const result: CloudStorageInfoList[] = await this.DBTransaction.createQueryBuilder(
            CloudStorageFilesModel,
            "f",
        )
            .addSelect("f.file_uuid", "fileUUID")
            .addSelect("f.file_name", "fileName")
            .addSelect("f.file_size", "fileSize")
            .addSelect("f.file_url", "fileURL")
            .addSelect("f.created_at", "createAt")
            .addSelect("f.payload", "payload")
            .addSelect("f.resource_type", "resourceType")
            .innerJoin(CloudStorageUserFilesModel, "uf", "uf.file_uuid = f.file_uuid")
            .where("uf.user_uuid = :userUUID", { userUUID: this.userUUID })
            .andWhere("uf.is_delete = :isDelete", { isDelete: false })
            .andWhere("f.is_delete = :isDelete", { isDelete: false })
            .orderBy("f.created_at", config.order)
            .offset((config.page - 1) * config.size)
            .limit(config.size)
            .getRawMany();

        const r = result.map(
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

        this.logger.debug(`list result: ${JSON.stringify(r, null, 2)}`);
        return r;
    }

    public async listFilesAndTotalUsageByUserUUID(
        config: CloudStorageInfoListParamsConfig,
    ): Promise<ListFilesAndTotalUsageByUserUUIDReturn> {
        const totalUsage = await this.totalUsage();
        const files = await this.list(config);

        return {
            totalUsage,
            files,
        };
    }
}
