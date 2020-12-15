import { FastifyRoutes } from "../../types/Server";
import { generateRTC, generateRTCSchemaType } from "./token/RTC";
import { generateRTM, generateRTMSchemaType } from "./token/RTM";

export const httpAgora: Readonly<FastifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "post",
        path: "agora/token/generate/rtc",
        handler: generateRTC,
        auth: true,
        schema: generateRTCSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "agora/token/generate/rtm",
        handler: generateRTM,
        auth: true,
        schema: generateRTMSchemaType,
    }),
]);
