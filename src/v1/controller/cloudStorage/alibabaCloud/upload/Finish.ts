import {
    CloudStorageConfigsDAO,
    CloudStorageFilesDAO,
    CloudStorageUserFilesDAO,
} from "../../../../../dao";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage, getFilePath, getOSSFileURLPath } from "./Utils";
import { isExistObject } from "../Utils";
import { Controller } from "../../../../../decorator/Controller";
import { AbstractController } from "../../../../../abstract/controller";
import { isWhiteboardCourseware } from "../../convert/Utils";
import { FileConvertStep, FileResourceType } from "../../../../../model/cloudStorage/Constants";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import { Whiteboard } from "../../../../../constants/Config";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/alibaba-cloud/upload/finish",
    auth: true,
})
export class AlibabaCloudUploadFinish extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileUUID"],
            properties: {
                fileUUID: {
                    type: "string",
                    format: "uuid-v4",
                },
                isWhiteboardProjector: {
                    type: "boolean",
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUID, isWhiteboardProjector } = this.body;
        const userUUID = this.userUUID;

        const fileInfo = await RedisService.hmget(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            ["fileName", "fileSize"],
        );

        const fileName = fileInfo[0];
        const fileSize = Number(fileInfo[1]);

        if (!fileName || Number.isNaN(fileSize)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const fullPath = getFilePath(fileName, fileUUID);

        if (!(await isExistObject(fullPath))) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const { fail, totalUsage } = await checkTotalUsage(userUUID, fileSize);

        if (fail) {
            return {
                status: Status.Failed,
                code: ErrorCode.NotEnoughTotalUsage,
            };
        }

        const alibabaCloudFileURL = getOSSFileURLPath(fullPath);

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                CloudStorageFilesDAO(t).insert({
                    file_name: fileName,
                    file_size: fileSize,
                    file_url: alibabaCloudFileURL,
                    file_uuid: fileUUID,
                    payload: {
                        region: Whiteboard.convertRegion,
                        convert_step: FileConvertStep.None,
                    },
                    resource_type: isWhiteboardProjector
                        ? FileResourceType.WhiteboardProjector
                        : isWhiteboardCourseware(fileName)
                        ? FileResourceType.WhiteboardConvert
                        : FileResourceType.NormalResources,
                }),
            );

            commands.push(
                CloudStorageUserFilesDAO(t).insert({
                    user_uuid: userUUID,
                    file_uuid: fileUUID,
                }),
            );

            commands.push(
                CloudStorageConfigsDAO(t).insert(
                    {
                        user_uuid: userUUID,
                        total_usage: String(totalUsage),
                    },
                    {
                        orUpdate: {
                            total_usage: String(totalUsage),
                        },
                    },
                ),
            );

            await Promise.all(commands);
            await RedisService.del(RedisKey.cloudStorageFileInfo(userUUID, fileUUID));
        });

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        fileUUID: string;
        isWhiteboardProjector?: boolean;
    };
}

interface ResponseType {}
