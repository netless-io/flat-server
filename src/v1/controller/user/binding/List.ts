import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { LoginPlatform, Status } from "../../../../constants/Project";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";
import { ServiceUserPhone } from "../../../service/user/UserPhone";
import { ServiceUserAgora } from "../../../service/user/UserAgora";
import { ServiceUserApple } from "../../../service/user/UserApple";
import { ServiceUserGithub } from "../../../service/user/UserGithub";
import { ServiceUserGoogle } from "../../../service/user/UserGoogle";
import { ServiceUserEmail } from "../../../service/user/UserEmail";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/binding/list",
    auth: true,
})
export class BindingList extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {};

    private readonly svc = {
        [LoginPlatform.WeChat]: new ServiceUserWeChat(this.userUUID),
        [LoginPlatform.Phone]: new ServiceUserPhone(this.userUUID),
        [LoginPlatform.Agora]: new ServiceUserAgora(this.userUUID),
        [LoginPlatform.Apple]: new ServiceUserApple(this.userUUID),
        [LoginPlatform.Github]: new ServiceUserGithub(this.userUUID),
        [LoginPlatform.Google]: new ServiceUserGoogle(this.userUUID),
        [LoginPlatform.Email]: new ServiceUserEmail(this.userUUID),
    };

    public async execute(): Promise<Response<ResponseType>> {
        const result = { meta: {} } as ResponseType;

        await Promise.all([
            this.listWeChat(result),
            this.listPhone(result),
            this.listAgora(result),
            this.listApple(result),
            this.listGithub(result),
            this.listGoogle(result),
            this.listEmail(result),
        ]);

        return {
            status: Status.Success,
            data: result,
        };
    }

    private async listWeChat(result: ResponseType): Promise<void> {
        const name = await this.svc[LoginPlatform.WeChat].name();
        result.wechat = name !== null;
        result.meta.wechat = name || "";
    }

    private async listPhone(result: ResponseType): Promise<void> {
        const phone = await this.svc[LoginPlatform.Phone].phoneNumber();
        result.phone = phone !== null;
        result.meta.phone = phone || "";
    }

    private async listAgora(result: ResponseType): Promise<void> {
        const agora = await this.svc[LoginPlatform.Agora].name();
        result.agora = agora !== null;
        result.meta.agora = agora || "";
    }

    private async listApple(result: ResponseType): Promise<void> {
        const apple = await this.svc[LoginPlatform.Apple].name();
        result.apple = apple !== null;
        result.meta.apple = apple || "";
    }

    private async listGithub(result: ResponseType): Promise<void> {
        const github = await this.svc[LoginPlatform.Github].name();
        result.github = github !== null;
        result.meta.github = github || "";
    }

    private async listGoogle(result: ResponseType): Promise<void> {
        const google = await this.svc[LoginPlatform.Google].name();
        result.google = google !== null;
        result.meta.google = google || "";
    }

    private async listEmail(result: ResponseType): Promise<void> {
        const email = await this.svc[LoginPlatform.Email].email();
        result.email = email !== null;
        result.meta.email = email || "";
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {}

type ResponseType = Record<Lowercase<LoginPlatform>, boolean> & {
    meta: Record<Lowercase<LoginPlatform>, string>;
};
