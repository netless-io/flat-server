import { getConnection } from "typeorm";
import {
    CloudStorageConfigsDAO,
    CloudStorageFilesDAO,
    CloudStorageUserFilesDAO,
} from "../../../../../dao";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Region, Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage } from "./Utils";
import { getFilePath, isExistObject, getOSSFileURLPath } from "../Utils";
import { Controller } from "../../../../../decorator/Controller";
import { AbstractController } from "../../../../../abstract/controller";

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
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUID } = this.body;
        const userUUID = this.userUUID;

        const fileInfo = await RedisService.hmget(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            ["fileName", "fileSize", "region"],
        );

        const fileName = fileInfo[0];
        const fileSize = Number(fileInfo[1]);
        const region = fileInfo[2] as Region;

        if (!fileName || Number.isNaN(fileSize) || !Object.values(Region).includes(region)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const fullPath = getFilePath(fileName, fileUUID);

        if (!(await isExistObject(fullPath, region))) {
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

        const alibabaCloudFileURL = getOSSFileURLPath(fullPath, region);

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                CloudStorageFilesDAO(t).insert({
                    file_name: fileName,
                    file_size: fileSize,
                    file_url: alibabaCloudFileURL,
                    file_uuid: fileUUID,
                    region,
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
    };
}

interface ResponseType {}
