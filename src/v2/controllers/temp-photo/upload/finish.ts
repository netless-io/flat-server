import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageUploadService } from "../../../services/cloud-storage/upload";

export const tempPhotoUploadFinishSchema = {
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

export const tempPhotoUploadFinish = async (
    req: FastifyRequestTypebox<typeof tempPhotoUploadFinishSchema>,
): Promise<Response> => {
    const cloudStorageUploadSVC = new CloudStorageUploadService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    await cloudStorageUploadSVC.tempPhotoFinish({
        fileUUID: req.body.fileUUID,
    });

    return successJSON({});
};
