import { Server } from "../../../utils/registryRoutersV2";
import { loginEmail, loginEmailSchema } from "./email";
import { loginPhone, loginPhoneSchema } from "./phone";

export const loginRouters = (server: Server): void => {
    server.post("login/phone", loginPhone, {
        schema: loginPhoneSchema,
        auth: false,
        ipblock: true,
    });

    server.post("login/email", loginEmail, {
        schema: loginEmailSchema,
        auth: false,
        ipblock: true,
    });
};
