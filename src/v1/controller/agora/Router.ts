import { GenerateRTC } from "./token/RTC";
import { GenerateRTM } from "./token/RTM";
import { ControllerClass } from "../../../abstract/controller";
import { MessageCallback } from "./message/Callback";
import { RTMCensor } from "./rtm/censor";

export const agoraRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    GenerateRTC,
    GenerateRTM,
    MessageCallback,
    RTMCensor,
]);
