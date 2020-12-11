import { socketLogin } from "./sockets/login/Routes";
import { httpLogin } from "./controller/login/Router";
import { httpAgora } from "./controller/agora/Router";
import { IORoutes, RestifyRoutes } from "./types/Server";

export const httpRoutes: Readonly<Readonly<RestifyRoutes[]>[]> = Object.freeze([httpLogin, httpAgora]);

export const socketRoutes: Readonly<Readonly<IORoutes[]>[]> = Object.freeze([socketLogin]);
