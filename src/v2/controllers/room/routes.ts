import { Server } from "../../../utils/registryRoutersV2";
import { roomExportUsers, roomExportUsersSchema } from "./export-users";

export const roomRouters = (server: Server): void => {
    server.post("room/export-users", roomExportUsers, {
        schema: roomExportUsersSchema,
    });
};
