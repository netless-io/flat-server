import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageConvertService } from "../../../services/cloud-storage/convert";

export const cloudStorageConvertFinishSchema = {
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

export const cloudStorageConvertFinish = async (
    req: FastifyRequestTypebox<typeof cloudStorageConvertFinishSchema>,
): Promise<Response> => {
    const cloudStorageConvertSVC = new CloudStorageConvertService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    await cloudStorageConvertSVC.finish(req.body.fileUUID);

    return successJSON({});
};
