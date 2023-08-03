import { Server } from "../../../utils/registryRoutersV2";
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
};
