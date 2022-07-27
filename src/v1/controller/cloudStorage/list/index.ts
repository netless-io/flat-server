import { Status } from "../../../../constants/Project";
import { CloudStorageConfigsDAO } from "../../../../dao";
import { CloudStorageFilesModel } from "../../../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../../../model/cloudStorage/CloudStorageUserFiles";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { FileConvertStep, FileResourceType } from "../../../../model/cloudStorage/Constants";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { FilePayload } from "../../../../model/cloudStorage/Types";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { Whiteboard } from "../../../../constants/Config";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/list",
    auth: true,
})
export class CloudStorageList extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        querystring: {
            type: "object",
            required: ["page"],
            properties: {
                page: {
                    type: "integer",
                    maximum: 50,
                    minimum: 1,
                },
                size: {
                    type: "integer",
                    minimum: 1,
                    maximum: 50,
                    default: 50,
                },
                order: {
                    type: "string",
                    enum: ["ASC", "DESC"],
                    default: "ASC",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { page, order, size } = this.querystring;
        const userUUID = this.userUUID;

        const userInfo = await CloudStorageConfigsDAO().findOne(["total_usage"], {
            user_uuid: userUUID,
        });

        const files = await dataSource
            .createQueryBuilder(CloudStorageUserFilesModel, "fc")
            .addSelect("f.file_uuid", "file_uuid")
            .addSelect("f.file_name", "file_name")
            .addSelect("f.file_size", "file_size")
            .addSelect("f.file_url", "file_url")
            .addSelect("f.created_at", "create_at")
            .addSelect("f.payload", "payload")
            .addSelect("f.resource_type", "resource_type")
            .innerJoin(CloudStorageFilesModel, "f", "fc.file_uuid = f.file_uuid")
            .where(
                `fc.user_uuid = :userUUID
                AND f.resource_type <> :exResourceType
                AND fc.is_delete = :isDelete
                AND f.is_delete = :isDelete`,
                {
                    userUUID,
                    // exclude directory resource type
                    exResourceType: FileResourceType.Directory,
                    isDelete: false,
                },
            )
            .orderBy("f.created_at", order)
            .offset((page - 1) * size)
            .limit(size)
            .getRawMany();

        const resp = files.map((file: CloudStorageFile) => {
            const payload = file.payload as Record<string, any>;
            return {
                fileUUID: file.file_uuid,
                fileName: file.file_name,
                fileSize: file.file_size,
                fileURL: file.file_url,
                convertStep: payload?.convertStep || FileConvertStep.None,
                taskUUID: payload?.taskUUID || "",
                taskToken: payload?.taskToken || "",
                createAt: file.create_at.valueOf(),
                region: payload.region || "none",
                external: payload.region === "none",
                resourceType: file.resource_type,
            };
        });

        return {
            status: Status.Success,
            data: {
                totalUsage: Number(userInfo?.total_usage) || 0,
                files: resp,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    querystring: {
        page: number;
        size: number;
        order: "ASC" | "DESC";
    };
}

interface ResponseType {
    totalUsage: number;
    files: Array<{
        fileUUID: string;
        fileName: string;
        fileSize: number;
        fileURL: string;
        convertStep: FileConvertStep;
        taskUUID: string;
        taskToken: string;
        createAt: number;
        region: typeof Whiteboard.convertRegion | "none";
        external: boolean;
        resourceType: FileResourceType;
    }>;
}

interface CloudStorageFile {
    file_uuid: string;
    file_name: string;
    file_size: number;
    file_url: string;
    create_at: Date;
    payload: FilePayload;
    resource_type: FileResourceType;
}
