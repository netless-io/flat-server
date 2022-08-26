import { Static, Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageConvertService } from "../../../services/cloud-storage/convert";
import { CloudStorageConvertStartReturnSchema } from "../../../services/cloud-storage/convert.schema";

export const cloudStorageConvertStartSchema = {
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

export const cloudStorageConvertStart = async (
    req: FastifyRequestTypebox<typeof cloudStorageConvertStartSchema>,
): Promise<Response<Static<typeof CloudStorageConvertStartReturnSchema>>> => {
    const cloudStorageConvertSVC = new CloudStorageConvertService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    const result = await cloudStorageConvertSVC.start(req.body.fileUUID);

    return successJSON(result);
};
