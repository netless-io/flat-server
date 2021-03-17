import { FastifyRoutes } from "./types/Server";
import { httpLogin } from "./controller/login/Router";
import { httpAgora } from "./controller/agora/Router";
import { httpRoom } from "./controller/room/Router";

export const httpRoutes: Readonly<Readonly<FastifyRoutes[]>[]> = Object.freeze([
    httpLogin,
    httpAgora,
    httpRoom,
]);
