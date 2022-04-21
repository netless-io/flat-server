import { ControllerClass } from "../../../abstract/controller";
import { Rename } from "./rename";
import { SendMessage } from "./bindingPhone/SendMessage";
import { BindingPhone } from "./bindingPhone/Binding";
import { DeleteAccountValidate } from "./deleteAccount/Validate";
import { DeleteAccount } from "./deleteAccount";

export const userRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    Rename,
    SendMessage,
    BindingPhone,
    DeleteAccountValidate,
    DeleteAccount,
]);
