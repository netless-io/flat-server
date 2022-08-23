import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageUploadService } from "../../../services/cloud-storage/upload";

export const cloudStorageUploadFinishSchema = {
    body: Type.Object(
        {
            fileUUID: Type.String({
                format: "uuid-v4",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const cloudStorageUploadFinish = async (
    req: FastifyRequestTypebox<typeof cloudStorageUploadFinishSchema>,
): Promise<Response> => {
    const cloudStorageUploadSVC = new CloudStorageUploadService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    await cloudStorageUploadSVC.finish({
        fileUUID: req.body.fileUUID,
    });

    return successJSON({});
};
