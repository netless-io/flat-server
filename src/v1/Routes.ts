import { FastifyRoutes } from "../types/Server";
import { loginRouters } from "./controller/login/Router";
import { agoraRouters } from "./controller/agora/Router";
import { roomRouters } from "./controller/room/Router";
import { cloudStorageRouters } from "./controller/cloudStorage/Router";

export const httpRouters: Readonly<Readonly<FastifyRoutes[]>[]> = Object.freeze([
    loginRouters,
    agoraRouters,
    roomRouters,
    cloudStorageRouters,
]);
