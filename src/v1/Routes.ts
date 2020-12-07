import { socketLogin } from "./sockets/login/Routes";
import { httpLogin } from "./controller/login/Router";
import { IORoutes, RestifyRoutes } from "./types/Server";

export const httpRoutes: Readonly<Readonly<RestifyRoutes[]>[]> = Object.freeze([httpLogin]);

export const socketRoutes: Readonly<Readonly<IORoutes[]>[]> = Object.freeze([socketLogin]);
