import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { CloudStorageDeleteService } from "../../../services/cloud-storage/delete";

export const cloudStorageDeleteSchema = {
    body: Type.Object(
        {
            uuids: Type.Array(
                Type.String({
                    format: "uuid-v4",
                }),
                {
                    minItems: 1,
                    maxItems: 50,
                },
            ),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const cloudStorageDelete = async (
    req: FastifyRequestTypebox<typeof cloudStorageDeleteSchema>,
): Promise<Response<Record<string, never>>> => {
    await new CloudStorageDeleteService(req.ids, req.DBTransaction, req.userUUID).delete({
        uuids: req.body.uuids,
    });

    return successJSON({});
};
