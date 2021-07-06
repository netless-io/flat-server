import { WechatWebCallback } from "./weChat/web/Callback";
import { WechatMobileCallback } from "./weChat/mobile/Callback";
import { GithubCallback } from "./github/Callback";
import { SetAuthUUID } from "./SetAuthUUID";
import { Login } from "./Login";
import { LoginProcess } from "./Process";
import { ControllerClass } from "../../../abstract/Controller";

export const loginRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    SetAuthUUID,
    LoginProcess,
    WechatWebCallback,
    WechatMobileCallback,
    GithubCallback,
    Login,
]);
