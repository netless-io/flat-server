import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageDirectoryService } from "../../../services/cloud-storage/directory";

export const cloudStorageDirectoryCreateSchema = {
    body: Type.Object(
        {
            parentDirectoryPath: Type.String({
                maxLength: 298,
                minLength: 1,
                format: "directory-path",
            }),
            directoryName: Type.String({
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

export const cloudStorageDirectoryCreate = async (
    req: FastifyRequestTypebox<typeof cloudStorageDirectoryCreateSchema>,
): Promise<Response> => {
    await new CloudStorageDirectoryService(req.reqID, req.DBTransaction, req.userUUID).create(
        req.body.parentDirectoryPath,
        req.body.directoryName,
    );

    return successJSON({});
};
