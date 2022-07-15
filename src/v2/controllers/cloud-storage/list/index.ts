import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { CloudStorageInfoService } from "../../../services/cloud-storage/info";
import { successJSON } from "../../internal/utils/response-json";

export const cloudStorageListSchema = {
    body: Type.Object(
        {
            page: Type.Integer({
                maximum: 50,
                minimum: 1,
            }),
            size: Type.Optional(
                Type.Integer({
                    minimum: 1,
                    maximum: 50,
                    default: 50,
                }),
            ),
            order: Type.Optional(
                Type.String({
                    enum: ["ASC", "DESC"],
                    default: "ASC",
                }),
            ),
            directoryPath: Type.String({
                maxLength: 300,
                minLength: 1,
                format: "directory-path",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const cloudStorageList = async (
    req: FastifyRequestTypebox<typeof cloudStorageListSchema>,
): Promise<Response> => {
    const data = await new CloudStorageInfoService(
        req.reqID,
        req.DBTransaction,
        req.userUUID,
    ).listFilesAndTotalUsageByUserUUID({
        page: req.body.page,
        order: req.body.order as "ASC" | "DESC",
        size: req.body.size as number,
        directoryPath: req.body.directoryPath,
    });

    return successJSON(data);
};
