import { v4 } from "uuid";
import { CloudStorage } from "../../../../../constants/Process";
import { Region, Status } from "../../../../../constants/Project";

import { ErrorCode } from "../../../../../ErrorCode";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { policyTemplate } from "../Utils";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { checkTotalUsage, getFilePath, getOSSDomain } from "./Utils";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/alibaba-cloud/upload/start",
    auth: true,
})
export class AlibabaCloudUploadStart extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileName", "fileSize", "region"],
            properties: {
                fileName: {
                    type: "string",
                    format: "file-suffix",
                    maxLength: 128,
                },
                fileSize: {
                    type: "number",
                    minimum: 1,
                    maximum: CloudStorage.SINGLE_FILE_SIZE,
                },
                region: {
                    type: "string",
                    enum: [Region.CN_HZ, Region.US_SV, Region.SG, Region.IN_MUM, Region.GB_LON],
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileName, fileSize, region } = this.body;
        const userUUID = this.userUUID;

        // check upload concurrent and file size and total usage
        {
            const uploadingFiles = await RedisService.scan(
                RedisKey.cloudStorageFileInfo(userUUID, "*"),
                CloudStorage.CONCURRENT + 1,
                true,
            );

            if (uploadingFiles.length >= CloudStorage.CONCURRENT) {
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

            if (uploadingFileTotalSize > CloudStorage.TOTAL_SIZE) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.NotEnoughTotalUsage,
                };
            }
        }

        const fileUUID = v4();
        const filePath = getFilePath(fileName, fileUUID);
        const { policy, signature } = policyTemplate(fileName, filePath, fileSize, region);

        await RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            {
                fileName,
                fileSize: String(fileSize),
                region,
            },
            60 * 60,
        );

        return {
            status: Status.Success,
            data: {
                fileUUID,
                filePath,
                policy,
                policyURL: getOSSDomain(region),
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
        region: Region;
    };
}

interface ResponseType {
    fileUUID: string;
    filePath: string;
    policy: string;
    policyURL: string;
    signature: string;
}
