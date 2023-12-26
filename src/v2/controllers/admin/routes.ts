import { Server } from "../../../utils/registryRoutersV2";
import { banRooms, banRoomsSchema } from "./ban-rooms";
import { online, onlineSchema } from "./online";
import { roomMessages, roomMessagesSchema } from "./room-messages";
import { roomsInfo, roomsInfoSchema } from "./rooms-info";

export const adminRouters = (server: Server): void => {
    // /v2/rooms-info and /v2/online do not need admin
    server.post("rooms-info", roomsInfo, {
        schema: roomsInfoSchema,
        auth: false,
    });

    server.post("online", online, {
        schema: onlineSchema,
    });

    server.post("admin/ban-rooms", banRooms, {
        schema: banRoomsSchema,
        auth: false,
        admin: true,
    });

    server.post("admin/room-messages", roomMessages, {
        schema: roomMessagesSchema,
        auth: false,
        admin: true,
    });
};
