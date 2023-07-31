import { Server } from "../../../utils/registryRoutersV2";
import { userRename, userRenameSchema } from "./rename";
import { userUploadAvatarStart, userUploadAvatarStartSchema } from "./upload-avatar/start";
import { userUploadAvatarFinish, userUploadAvatarFinishSchema } from "./upload-avatar/finish";
import { userSensitive, userSensitiveSchema } from "./sensitive";
import {
    userRebindPhoneSendMessage,
    userRebindPhoneSendMessageSchema,
} from "./rebind-phone/send-message";
import { userRebindPhone, userRebindPhoneSchema } from "./rebind-phone";

export const userRouters = (server: Server): void => {
    server.post("user/rename", userRename, {
        schema: userRenameSchema,
    });

    server.post("user/upload-avatar/start", userUploadAvatarStart, {
        schema: userUploadAvatarStartSchema,
    });

    server.post("user/upload-avatar/finish", userUploadAvatarFinish, {
        schema: userUploadAvatarFinishSchema,
    });

    server.post("user/sensitive", userSensitive, {
        schema: userSensitiveSchema,
    });

    server.post("user/rebind-phone/send-message", userRebindPhoneSendMessage, {
        schema: userRebindPhoneSendMessageSchema,
    });

    server.post("user/rebind-phone", userRebindPhone, {
        schema: userRebindPhoneSchema,
    });
};
