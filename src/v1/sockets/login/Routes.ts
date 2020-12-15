import { weChat, weChatSchemaType } from "./weChat";
import { SocketNsp, WeChatSocketEvents } from "../../../Constants";
import { IORoutes } from "../../types/Server";

export const socketLogin: Readonly<IORoutes[]> = Object.freeze([
    Object.freeze({
        nsp: SocketNsp.Login,
        subs: [
            {
                eventName: WeChatSocketEvents.AuthID,
                handle: weChat,
                schema: weChatSchemaType,
            },
        ],
    }),
]);
