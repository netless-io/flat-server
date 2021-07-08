import { GenerateRTC } from "./token/RTC";
import { GenerateRTM } from "./token/RTM";
import { ControllerClass } from "../../../abstract/controller";

export const agoraRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    GenerateRTC,
    GenerateRTM,
]);
