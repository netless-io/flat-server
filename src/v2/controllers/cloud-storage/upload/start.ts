import { Static, Type } from "@sinclair/typebox";
import { CloudStorage } from "../../../../constants/Config";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageUploadService } from "../../../services/cloud-storage/upload";
import { uploadStartReturnSchema } from "../../../services/cloud-storage/upload.schema";
import { useOnceService } from "../../../service-locator";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";

export const cloudStorageUploadStartSchema = {
    body: Type.Object(
        {
            fileName: Type.String({
                minLength: 3,
                maxLength: 128,
                format: "file-suffix",
            }),
            fileSize: Type.Integer({
                maximum: CloudStorage.singleFileSize,
                minimum: 1,
            }),
            targetDirectoryPath: Type.String({
                maxLength: 298,
                minLength: 1,
                format: "directory-path",
            }),
            convertType: Type.Optional(Type.Enum(FileResourceType)),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const cloudStorageUploadStart = async (
    req: FastifyRequestTypebox<typeof cloudStorageUploadStartSchema>,
): Promise<Response<Static<typeof uploadStartReturnSchema>>> => {
    const complianceText = useOnceService("complianceText", req.ids);
    await complianceText.assertTextNormal(req.body.fileName);

    const cloudStorageUploadSVC = new CloudStorageUploadService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    const result = await cloudStorageUploadSVC.start({
        fileName: req.body.fileName,
        fileSize: req.body.fileSize,
        targetDirectoryPath: req.body.targetDirectoryPath,
        convertType: req.body.convertType,
    });

    return successJSON(result);
};
