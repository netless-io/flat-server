import { callback, callbackSchemaType } from "./weChat";
import { login } from "./Login";
import { FastifyRoutes } from "../../types/Server";

export const httpLogin: Readonly<FastifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "get",
        path: "login/weChat/callback/:socketID",
        handler: callback,
        auth: false,
        schema: callbackSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "login",
        auth: true,
        handler: login,
    }),
]);
