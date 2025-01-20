import { GenerateRTC } from "./token/RTC";
import { GenerateRTM } from "./token/RTM";
import { ControllerClass } from "../../../abstract/controller";
import { MessageCallback } from "./message/Callback";
import { RTMCensor } from "./rtm/censor";
import { AgoraAIPing } from "./ai/ping";
import { AgoraAIStart } from "./ai/start";
import { AgoraAIStop } from "./ai/stop";

export const agoraRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    GenerateRTC,
    GenerateRTM,
    MessageCallback,
    RTMCensor,
    AgoraAIPing,
    AgoraAIStart,
    AgoraAIStop
]);
