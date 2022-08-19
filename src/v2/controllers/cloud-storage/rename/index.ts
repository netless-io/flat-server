import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageRenameService } from "../../../services/cloud-storage/rename";

export const cloudStorageRenameSchema = {
    body: Type.Object(
        {
            fileUUID: Type.String({
                format: "uuid-v4",
            }),
            newName: Type.String({
                maxLength: 50,
                minLength: 1,
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const cloudStorageRename = async (
    req: FastifyRequestTypebox<typeof cloudStorageRenameSchema>,
): Promise<Response> => {
    const cloudStorageRenameSVC = new CloudStorageRenameService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    await cloudStorageRenameSVC.rename(req.body.fileUUID, req.body.newName);

    return successJSON({});
};
