import { callback, callbackSchemaType } from "./weChat/Callback";
import { setAuthID, setAuthIDSchemaType } from "./weChat/SetAuthID";
import { login } from "./Login";
import { FastifyRoutes } from "../../types/Server";
import { wechatLoginProcess, wechatLoginProcessSchemaType } from "./weChat/Process";

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
        path: "login/weChat/callback",
        handler: callback,
        skipAutoHandle: true,
        auth: false,
        schema: callbackSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "login/weChat/process",
        handler: wechatLoginProcess,
        skipAutoHandle: true,
        auth: false,
        schema: wechatLoginProcessSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "login",
        auth: true,
        handler: login,
    }),
]);
