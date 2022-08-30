import { Server } from "../../../utils/registryRoutersV2";
import { userRename, userRenameSchema } from "./rename";

export const userRouters = (server: Server): void => {
    server.post("user/rename", userRename, {
        schema: userRenameSchema,
    });
};
