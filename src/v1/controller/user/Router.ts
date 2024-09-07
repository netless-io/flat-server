import { ControllerClass } from "../../../abstract/controller";
import { Rename } from "./rename";
import { SendMessage } from "./binding/platform/phone/SendMessage";
import { SendMessage as SendEmail } from "./binding/platform/email/SendMessage";
import { BindingPhone } from "./binding/platform/phone/Binding";
import { DeleteAccountValidate } from "./deleteAccount/Validate";
import { DeleteAccount } from "./deleteAccount";
import { UploadAvatarStart } from "./uploadAvatar/Start";
import { UploadAvatarFinish } from "./uploadAvatar/Finish";
import { BindingWeChatMobile, BindingWeChatWeb } from "./binding/platform/wechat/Binding";
import { SetAuthUUID } from "./binding/SetAuthUUID";
import { BindingProcess } from "./binding/Process";
import { BindingList } from "./binding/List";
import { RemoveBinding } from "./binding/Remove";
import { BindingAgora } from "./binding/platform/agora/Binding";
import { BindingGithub } from "./binding/platform/github/Binding";
import { BindingGoogle } from "./binding/platform/google/Binding";
import { BindingEmail } from "./binding/platform/email/Binding";
import { BindingApple } from "./binding/platform/apple/Binding";
import { AgreementSet } from "./agreement/Set";
import { AgreementGet } from "./agreement/Get";
import { AgreementGetToRtc } from "./agreement/GetToRtc";

export const userRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    Rename,
    SendMessage,
    BindingPhone,
    BindingWeChatWeb,
    BindingWeChatMobile,
    BindingGithub,
    BindingApple,
    BindingAgora,
    BindingGoogle,
    BindingEmail,
    SendEmail,
    SetAuthUUID,
    BindingProcess,
    BindingList,
    RemoveBinding,
    DeleteAccountValidate,
    DeleteAccount,
    UploadAvatarStart,
    UploadAvatarFinish,
    AgreementSet,
    AgreementGet,
    AgreementGetToRtc
]);
