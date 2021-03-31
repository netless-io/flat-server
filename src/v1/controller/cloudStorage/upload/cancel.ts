import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RedisKey } from "../../../../utils/Redis";
import RedisService from "../../../thirdPartyService/RedisService";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";

export const uploadCancel = async (
    req: PatchRequest<{
        Body: UploadCancelBody;
    }>,
): Response<UploadCancelResponse> => {
    const { fileUUIDs } = req.body;
    const { userUUID } = req.user;

    try {
        for (const fileUUID of fileUUIDs) {
            await RedisService.del(RedisKey.cloudStorageFileInfo(userUUID, fileUUID));
        }

        return {
            status: Status.Success,
            data: {},
        };
    } catch (err) {
        console.error(err);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface UploadCancelBody {
    fileUUIDs: string[];
}

export const uploadCancelSchemaType: FastifySchema<{
    body: UploadCancelBody;
}> = {
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
            },
        },
    },
};

interface UploadCancelResponse {}
