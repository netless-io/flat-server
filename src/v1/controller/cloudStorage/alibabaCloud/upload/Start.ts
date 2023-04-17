import { v4 } from "uuid";
import { CloudStorage } from "../../../../../constants/Config";
import { Status } from "../../../../../constants/Project";

import { ErrorCode } from "../../../../../ErrorCode";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { policyTemplate } from "../Utils";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage, getFilePath, getOSSDomain } from "./Utils";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { aliGreenText } from "../../../../utils/AliGreen";
import { ControllerError } from "../../../../../error/ControllerError";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/alibaba-cloud/upload/start",
    auth: true,
})
export class AlibabaCloudUploadStart extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileName", "fileSize"],
            properties: {
                fileName: {
                    type: "string",
                    format: "file-suffix",
                    maxLength: 128,
                },
                fileSize: {
                    type: "number",
                    minimum: 1,
                    maximum: CloudStorage.singleFileSize,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileName, fileSize } = this.body;
        const userUUID = this.userUUID;

        if (await aliGreenText.textNonCompliant(fileName)) {
            throw new ControllerError(ErrorCode.NonCompliant);
        }

        // check upload concurrent and file size and total usage
        {
            const uploadingFiles = await RedisService.scan(
                RedisKey.cloudStorageFileInfo(userUUID, "*"),
                CloudStorage.concurrent + 1,
            );

            if (uploadingFiles.length >= CloudStorage.concurrent) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.UploadConcurrentLimit,
                };
            }

            const { totalUsage, fail } = await checkTotalUsage(userUUID, fileSize);

            if (fail) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.NotEnoughTotalUsage,
                };
            }

            const uploadingFileTotalSize = await uploadingFiles.reduce(async (accP, current) => {
                const accFileSize = await accP;

                const currentFileSize = await RedisService.hmget(current, "fileSize");

                return accFileSize + (Number(currentFileSize) || 0);
            }, Promise.resolve(totalUsage));

            if (uploadingFileTotalSize > CloudStorage.totalSize) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.NotEnoughTotalUsage,
                };
            }
        }

        const fileUUID = v4();
        const filePath = getFilePath(fileName, fileUUID);
        const { policy, signature } = policyTemplate(fileName, filePath, fileSize);

        await RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            {
                fileName,
                fileSize: String(fileSize),
            },
            60,
        );

        return {
            status: Status.Success,
            data: {
                fileUUID,
                filePath,
                policy,
                policyURL: getOSSDomain(),
                signature,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        fileName: string;
        fileSize: number;
    };
}

interface ResponseType {
    fileUUID: string;
    filePath: string;
    policy: string;
    policyURL: string;
    signature: string;
}
