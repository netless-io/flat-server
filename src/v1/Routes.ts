import { FastifyRoutes, IORoutes } from "./types/Server";
import { socketLogin } from "./sockets/login/Routes";
import { httpLogin } from "./controller/login/Router";
import { httpAgora } from "./controller/agora/Router";

export const httpRoutes: Readonly<Readonly<FastifyRoutes[]>[]> = Object.freeze([
    httpLogin,
    httpAgora,
]);

export const socketRoutes: Readonly<Readonly<IORoutes[]>[]> = Object.freeze([socketLogin]);
