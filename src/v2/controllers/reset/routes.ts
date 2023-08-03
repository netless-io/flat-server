import { Server } from "../../../utils/registryRoutersV2";
import { resetEmail, resetEmailSchema } from "./email";
import { resetEmailSendMessage, resetEmailSendMessageSchema } from "./email/send-message";
import { resetPhone, resetPhoneSchema } from "./phone";
import { resetPhoneSendMessage, resetPhoneSendMessageSchema } from "./phone/send-message";

export const resetRouters = (server: Server): void => {
    server.post("reset/phone/send-message", resetPhoneSendMessage, {
        schema: resetPhoneSendMessageSchema,
        auth: false,
    });

    server.post("reset/phone", resetPhone, {
        schema: resetPhoneSchema,
        auth: false,
    });

    server.post("reset/email/send-message", resetEmailSendMessage, {
        schema: resetEmailSendMessageSchema,
        auth: false,
    });

    server.post("reset/email", resetEmail, {
        schema: resetEmailSchema,
        auth: false,
    });
};
