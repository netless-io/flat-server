import { WechatWebCallback } from "./weChat/web/Callback";
import { WechatMobileCallback } from "./weChat/mobile/Callback";
import { GithubCallback } from "./github/Callback";
import { SetAuthUUID } from "./SetAuthUUID";
import { Login } from "./Login";
import { LoginProcess } from "./Process";
import { ControllerClass } from "../../../abstract/controller";
import { AppleJWT } from "./apple/jwt";
import { AgoraCallback } from "./agora/Callback";
import { GoogleCallback } from "./google/Callback";
import { SendMessage } from "./phone/SendMessage";
import { PhoneLogin } from "./phone/Phone";

export const loginRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    SetAuthUUID,
    LoginProcess,
    WechatWebCallback,
    WechatMobileCallback,
    AppleJWT,
    GithubCallback,
    AgoraCallback,
    GoogleCallback,
    SendMessage,
    PhoneLogin,
    Login,
]);
