import { GenerateRTC } from "./token/RTC";
import { GenerateRTM } from "./token/RTM";
import { ControllerClass } from "../../../abstract/Controller";

export const agoraRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    GenerateRTC,
    GenerateRTM,
]);
