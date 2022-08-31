import { Type } from "@sinclair/typebox";
import { User } from "../../../../constants/Config";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserUploadAvatarService } from "../../../services/user/upload-avatar";
import { successJSON } from "../../internal/utils/response-json";
import { UserUploadAvatarStartReturn } from "../../../services/user/upload-avatar.type";

export const userUploadAvatarStartSchema = {
    body: Type.Object({
        fileName: Type.String({
            format: "avatar-suffix",
            minLength: 1,
            maxLength: 128,
        }),
        fileSize: Type.Number({
            minimum: 1,
            maximum: User.avatar.size,
        }),
    }),
};

export const userUploadAvatarStart = async (
    req: FastifyRequestTypebox<typeof userUploadAvatarStartSchema>,
): Promise<Response<UserUploadAvatarStartReturn>> => {
    const userUploadAvatarSVC = new UserUploadAvatarService(
        req.ids,
        req.DBTransaction,
        req.userUUID,
    );

    const result = await userUploadAvatarSVC.start(req.body);

    return successJSON(result);
};
