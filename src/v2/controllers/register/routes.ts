import { Server } from "../../../utils/registryRoutersV2";
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
};
