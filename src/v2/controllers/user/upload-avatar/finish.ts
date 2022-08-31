import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserUploadAvatarService } from "../../../services/user/upload-avatar";
import { successJSON } from "../../internal/utils/response-json";

export const userUploadAvatarFinishSchema = {
    body: Type.Object({
        fileUUID: Type.String({
            format: "uuid-v4",
        }),
    }),
};

export const userUploadAvatarFinish = async (
    req: FastifyRequestTypebox<typeof userUploadAvatarFinishSchema>,
): Promise<Response> => {
    const userUploadAvatarSVC = new UserUploadAvatarService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    await userUploadAvatarSVC.finish(req.body.fileUUID);

    return successJSON({});
};
