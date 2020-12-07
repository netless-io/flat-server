import { httpValidation } from "../../../utils/Validation";
import { callback, callbackValidationRules } from "./weChat";
import { login, loginValidationRules } from "./Login";
import { RestifyRoutes } from "../../types/Server";

export const httpLogin: Readonly<RestifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "get",
        path: "login/weChat/callback/:socketID",
        handle: httpValidation(callbackValidationRules, callback),
    }),
    Object.freeze({
        method: "post",
        path: "login",
        handle: httpValidation(loginValidationRules, login),
    }),
]);
