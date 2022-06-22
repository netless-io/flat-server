import { AbstractController } from "../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Controller } from "../../../../../decorator/Controller";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../../dao";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { In } from "typeorm";
import { ControllerError } from "../../../../../error/ControllerError";
import { CloudStorageUserFilesModel } from "../../../../../model/cloudStorage/CloudStorageUserFiles";
import { CloudStorageFilesModel } from "../../../../../model/cloudStorage/CloudStorageFiles";
import { FileResourceType } from "../../../../../model/cloudStorage/Constants";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/url-cloud/remove",
    auth: true,
})
export class URLCloudRemove extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileUUIDs"],
            properties: {
                fileUUIDs: {
                    type: "array",
                    items: {
                        type: "string",
                        format: "uuid-v4",
                    },
                    minItems: 1,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUIDs } = this.body;
        const userUUID = this.userUUID;

        await this.assertFilesOwnerIsCurrentUser();

        const fileInfo: FileInfoType[] = await dataSource
            .createQueryBuilder(CloudStorageUserFilesModel, "fc")
            .innerJoin(CloudStorageFilesModel, "f", "fc.file_uuid = f.file_uuid")
            .where(
                `f.file_uuid IN (:...fileUUIDs)
                AND AND f.resource_type IN (:...resourceType)
                AND fc.user_uuid = :userUUID
                AND fc.is_delete = false
                AND f.is_delete = false`,
                {
                    fileUUIDs,
                    userUUID,
                    resourceType: [FileResourceType.OnlineCourseware],
                },
            )
            .getRawMany();

        if (fileInfo.length === 0) {
            return {
                status: Status.Success,
                data: {},
            };
        }

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                CloudStorageUserFilesDAO(t).remove({
                    file_uuid: In(fileUUIDs),
                    user_uuid: userUUID,
                }),
            );

            commands.push(
                CloudStorageFilesDAO(t).remove({
                    file_uuid: In(fileUUIDs),
                }),
            );

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private async assertFilesOwnerIsCurrentUser(): Promise<void> {
        const filesOwner = await CloudStorageUserFilesDAO().find(["user_uuid"], {
            file_uuid: In(this.body.fileUUIDs),
        });

        for (const { user_uuid } of filesOwner) {
            if (user_uuid !== this.userUUID) {
                throw new ControllerError(ErrorCode.NotPermission);
            }
        }
    }
}

interface RequestType {
    body: {
        fileUUIDs: string[];
    };
}

interface ResponseType {}

interface FileInfoType {
    file_size: number;
}
