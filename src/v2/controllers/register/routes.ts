import { Server } from "../../../utils/registryRoutersV2";
import { registerEmail, registerEmailSchema } from "./email";
import { registerEmailSendMessage, registerEmailSendMessageSchema } from "./email/send-message";
import { registerPhone, registerPhoneSchema } from "./phone";
import { registerPhoneSendMessage, registerPhoneSendMessageSchema } from "./phone/send-message";

export const registerRouters = (server: Server): void => {
    server.post("register/phone/send-message", registerPhoneSendMessage, {
        schema: registerPhoneSendMessageSchema,
        auth: false,
    });

    server.post("register/phone", registerPhone, {
        schema: registerPhoneSchema,
        auth: false,
    });

    server.post("register/email/send-message", registerEmailSendMessage, {
        schema: registerEmailSendMessageSchema,
        auth: false,
    });

    server.post("register/email", registerEmail, {
        schema: registerEmailSchema,
        auth: false,
    });
};
