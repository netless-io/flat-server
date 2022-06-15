import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";
import { ServiceUserPhone } from "../../../service/user/UserPhone";
import { ServiceUserAgora } from "../../../service/user/UserAgora";
import { ServiceUserApple } from "../../../service/user/UserApple";
import { ServiceUserGithub } from "../../../service/user/UserGithub";
import { ServiceUserGoogle } from "../../../service/user/UserGoogle";
import { AgoraLogin, Apple, Github, Google, PhoneSMS, WeChat } from "../../../../constants/Config";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/binding/list",
    auth: true,
})
export class BindingList extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {};

    private readonly svc = {
        userWeChat: new ServiceUserWeChat(this.userUUID),
        userPhone: new ServiceUserPhone(this.userUUID),
        userAgora: new ServiceUserAgora(this.userUUID),
        userApple: new ServiceUserApple(this.userUUID),
        userGithub: new ServiceUserGithub(this.userUUID),
        userGoogle: new ServiceUserGoogle(this.userUUID),
    };

    public async execute(): Promise<Response<ResponseType>> {
        return {
            status: Status.Success,
            data: {
                wechat:
                    WeChat.web.enable || WeChat.mobile.enable
                        ? await this.svc.userWeChat.exist()
                        : false,
                phone: PhoneSMS.enable ? await this.svc.userPhone.exist() : false,
                agora: AgoraLogin.enable ? await this.svc.userAgora.exist() : false,
                apple: Apple.enable ? await this.svc.userApple.exist() : false,
                github: Github.enable ? await this.svc.userGithub.exist() : false,
                google: Google.enable ? await this.svc.userGoogle.exist() : false,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {}

type ResponseType = {
    wechat: boolean;
    phone: boolean;
    agora: boolean;
    apple: boolean;
    github: boolean;
    google: boolean;
};
