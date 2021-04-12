import {
    callback as webCallback,
    callbackSchemaType as webCallbackSchemaType,
} from "./weChat/web/Callback";
import {
    callback as mobileCallback,
    callbackSchemaType as mobileCallbackSchemaType,
} from "./weChat/mobile/Callback";
import { setAuthID, setAuthIDSchemaType } from "./weChat/SetAuthID";
import { login } from "./Login";
import { FastifyRoutes } from "../../types/Server";
import { wechatLoginProcess, wechatLoginProcessSchemaType } from "./weChat/web/Process";

export const httpLogin: Readonly<FastifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "post",
        path: "login/weChat/set-auth-id",
        handler: setAuthID,
        skipAutoHandle: true,
        auth: false,
        schema: setAuthIDSchemaType,
    }),
    Object.freeze({
        method: "get",
        path: "login/weChat/web/callback",
        handler: webCallback,
        skipAutoHandle: true,
        auth: false,
        schema: webCallbackSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "login/weChat/web/process",
        handler: wechatLoginProcess,
        auth: false,
        schema: wechatLoginProcessSchemaType,
    }),
    Object.freeze({
        method: "get",
        path: "login/weChat/mobile/callback",
        handler: mobileCallback,
        auth: false,
        schema: mobileCallbackSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "login",
        auth: true,
        handler: login,
    }),
]);
