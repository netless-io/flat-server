import { weChat, weChatValidationRules } from "./weChat";
import { SocketNsp, Status, WeChatSocketEvents } from "../../../Constants";
import { socketValidation } from "../../../utils/Validation";
import { IORoutes, IOSocket } from "../../types/Server";

const routes: Router[] = [
    {
        eventName: WeChatSocketEvents.AuthID,
        handle: weChat,
    },
];

export const socketLogin: Readonly<IORoutes[]> = Object.freeze([
    Object.freeze({
        nsp: SocketNsp.Login,
        handle: (socket: IOSocket) => {
            routes.forEach(({ eventName, handle }: Router): void => {
                socket.on(eventName, (data: AnyObj) => {
                    const validationResult = socketValidation(weChatValidationRules, data);
                    if (!validationResult.status) {
                        socket.emit(eventName, {
                            status: Status.Failed,
                            message: validationResult.message,
                        });

                        return;
                    }

                    handle(socket, data);
                });
            });
        },
    }),
]);

type Router = {
    eventName: WeChatSocketEvents;
    handle: (socket: IOSocket, data: any) => any;
};
