import { Server } from "../../../utils/registryRoutersV2";
import { loginPhone, loginPhoneSchema } from "./phone";

export const loginRouters = (server: Server): void => {
    server.post("login/phone", loginPhone, {
        schema: loginPhoneSchema,
        auth: false,
    });
};
