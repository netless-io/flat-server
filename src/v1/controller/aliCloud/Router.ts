import { ControllerClass } from "../../../abstract/controller";
import { VoiceCallback } from "./green/callback/Voice";

export const aliCloudRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    VoiceCallback,
]);
