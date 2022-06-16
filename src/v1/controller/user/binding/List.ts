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
                wechat: await this.svc.userWeChat.exist(),
                phone: await this.svc.userPhone.exist(),
                agora: await this.svc.userAgora.exist(),
                apple: await this.svc.userApple.exist(),
                github: await this.svc.userGithub.exist(),
                google: await this.svc.userGoogle.exist(),
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
