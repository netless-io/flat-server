import { loginRouters } from "./controller/login/Router";
import { agoraRouters } from "./controller/agora/Router";
import { roomRouters } from "./controller/room/Router";
import { cloudStorageRouters } from "./controller/cloudStorage/Router";
import { ControllerClass } from "../abstract/controller";
import { userRouters } from "./controller/user/Router";

export const httpRouters: Readonly<
    Array<Readonly<Array<ControllerClass<any, any>>>>
> = Object.freeze([agoraRouters, loginRouters, roomRouters, cloudStorageRouters, userRouters]);
