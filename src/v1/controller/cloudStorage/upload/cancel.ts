import { CloudStorage } from "../../../../constants/Process";
import { Status } from "../../../../constants/Project";
import { RedisKey } from "../../../../utils/Redis";
import RedisService from "../../../../thirdPartyService/RedisService";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/upload/cancel",
    auth: true,
})
export class UploadCancel extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: [],
            properties: {
                fileUUIDs: {
                    type: "array",
                    items: {
                        type: "string",
                        format: "uuid-v4",
                    },
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUIDs } = this.body;
        const userUUID = this.userUUID;

        if (typeof fileUUIDs === "undefined") {
            const uploadingFiles = await RedisService.scan(
                RedisKey.cloudStorageFileInfo(userUUID, "*"),
                CloudStorage.CONCURRENT + 1,
                true,
            );

            await RedisService.del(uploadingFiles);
        } else {
            await RedisService.del(
                fileUUIDs.map(fileUUID => RedisKey.cloudStorageFileInfo(userUUID, fileUUID)),
            );
        }

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.currentProcessFailed(error);
    }
}

interface RequestType {
    body: {
        fileUUIDs?: string[];
    };
}

interface ResponseType {}
