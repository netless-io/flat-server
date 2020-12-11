import { httpValidation } from "../../../utils/Validation";
import { RestifyRoutes } from "../../types/Server";
import { generateRTC, generateRTCValidationRules } from "./token/RTC";
import { generateRTM, generateRTMValidationRules } from "./token/RTM";

export const httpAgora: Readonly<RestifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "post",
        path: "agora/token/generate/rtc",
        handle: httpValidation(generateRTCValidationRules, generateRTC),
    }),
    Object.freeze({
        method: "post",
        path: "agora/token/generate/rtm",
        handle: httpValidation(generateRTMValidationRules, generateRTM),
    }),
]);
