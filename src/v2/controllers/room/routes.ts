import { Server } from "../../../utils/registryRoutersV2";
import { roomExportUsers, roomExportUsersSchema } from "./export-users";
import { roomListPmi, roomListPmiSchema } from "./list/pmi";

export const roomRouters = (server: Server): void => {
    server.post("room/export-users", roomExportUsers, {
        schema: roomExportUsersSchema,
    });

    server.post("room/list/pmi", roomListPmi, {
        schema: roomListPmiSchema,
    });
};
