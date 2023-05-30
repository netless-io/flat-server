import { Static, Type } from "@sinclair/typebox";
import { CloudStorage } from "../../../../constants/Config";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageUploadService } from "../../../services/cloud-storage/upload";
import { uploadStartReturnSchema } from "../../../services/cloud-storage/upload.schema";
import { useOnceService } from "../../../service-locator";

export const tempPhotoUploadStartSchema = {
    body: Type.Object(
        {
            fileName: Type.String({
                minLength: 3,
                maxLength: 128,
                format: "temp-photo-suffix",
            }),
            fileSize: Type.Integer({
                maximum: CloudStorage.tempPhoto.singleFileSize,
                minimum: 1,
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const tempPhotoUploadStart = async (
    req: FastifyRequestTypebox<typeof tempPhotoUploadStartSchema>,
): Promise<Response<Static<typeof uploadStartReturnSchema>>> => {
    const complianceText = useOnceService("complianceText", req.ids);
    await complianceText.assertTextNormal(req.body.fileName);

    const cloudStorageUploadSVC = new CloudStorageUploadService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    const result = await cloudStorageUploadSVC.tempPhotoStart({
        fileName: req.body.fileName,
        fileSize: req.body.fileSize,
    });

    return successJSON(result);
};
