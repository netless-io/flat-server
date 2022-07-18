import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { CloudStorageDirectoryService } from "../../../services/cloud-storage/directory";
import { successJSON } from "../../internal/utils/response-json";

export const cloudStorageRenameSchema = {
    body: Type.Object(
        {
            parentDirectoryPath: Type.String({
                maxLength: 298,
                minLength: 1,
                format: "directory-path",
            }),
            oldName: Type.String({
                maxLength: 50,
                minLength: 1,
                format: "directory-name",
            }),
            newName: Type.String({
                maxLength: 50,
                minLength: 1,
                format: "directory-name",
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
    await new CloudStorageDirectoryService(req.reqID, req.DBTransaction, req.userUUID).rename(
        req.body.parentDirectoryPath,
        req.body.oldName,
        req.body.newName,
    );

    return successJSON({});
};
