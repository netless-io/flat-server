import { socketNamespaces } from "./store/SocketNamespaces";
import { socketRoutes, httpRoutes } from "./Routes";
import { Server } from "restify";
import { IORoutes, IOServer, RestifyRoutes } from "./types/Server";

export const v1RegisterHTTP = (server: Server): void => {
    // @ts-ignore
    httpRoutes.flat(Infinity).forEach((item: RestifyRoutes) => {
        const { method, path, handle } = item;

        // @ts-ignore
        server[method](`/v1/${path}`, [handle]);
    });
};

export const v1RegisterWs = (io: IOServer): void => {
    // @ts-ignore
    socketRoutes.flat(Infinity).forEach((item: IORoutes) => {
        const { nsp, handle } = item;
        socketNamespaces[nsp] = io.of(`v1/${nsp}`);

        socketNamespaces[nsp].on("connection", handle);
    });
};
