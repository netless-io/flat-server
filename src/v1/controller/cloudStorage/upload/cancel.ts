import { CloudStorage } from "../../../../constants/Process";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RedisKey } from "../../../../utils/Redis";
import RedisService from "../../../../thirdPartyService/RedisService";
import { Controller, FastifySchema } from "../../../../types/Server";
import { parseError } from "../../../../logger";

export const uploadCancel: Controller<UploadCancelRequest, UploadCancelResponse> = async ({
    req,
    logger,
}) => {
    const { fileUUIDs } = req.body;
    const { userUUID } = req.user;

    try {
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
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface UploadCancelRequest {
    body: {
        fileUUIDs?: string[];
    };
}

export const uploadCancelSchemaType: FastifySchema<UploadCancelRequest> = {
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

interface UploadCancelResponse {}
