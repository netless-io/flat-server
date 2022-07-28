import { loginRouters } from "./controller/login/Router";
import { agoraRouters } from "./controller/agora/Router";
import { roomRouters } from "./controller/room/Router";
import { cloudStorageRouters } from "./controller/cloudStorage/Router";
import { ControllerClass } from "../abstract/controller";
import { userRouters } from "./controller/user/Router";
import { aliCloudRouters } from "./controller/aliCloud/Router";
import { logRouters } from "./controller/logger/Router";

export const httpRouters: Readonly<
    Array<Readonly<Array<ControllerClass<any, any>>>>
> = Object.freeze([
    agoraRouters,
    aliCloudRouters,
    loginRouters,
    roomRouters,
    cloudStorageRouters,
    logRouters,
    userRouters,
]);
