import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { CloudStorageDirectoryService } from "../../../services/cloud-storage/directory";
import { successJSON } from "../../internal/utils/response-json";

export const cloudStorageDirectoryRenameSchema = {
    body: Type.Object(
        {
            parentDirectoryPath: Type.String({
                maxLength: 298,
                minLength: 1,
                format: "directory-path",
            }),
            oldDirectoryName: Type.String({
                maxLength: 50,
                minLength: 1,
                format: "directory-name",
            }),
            newDirectoryName: Type.String({
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

export const cloudStorageDirectoryRename = async (
    req: FastifyRequestTypebox<typeof cloudStorageDirectoryRenameSchema>,
): Promise<Response> => {
    await new CloudStorageDirectoryService(req.reqID, req.DBTransaction, req.userUUID).rename(
        req.body.parentDirectoryPath,
        req.body.oldDirectoryName,
        req.body.newDirectoryName,
    );

    return successJSON({});
};
