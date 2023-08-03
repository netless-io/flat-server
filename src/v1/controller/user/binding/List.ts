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
        const result = {} as Record<Lowercase<LoginPlatform>, boolean>;

        await Promise.all(
            Object.keys(this.svc).map(svc => {
                return this.svc[svc as LoginPlatform].exist().then(exist => {
                    result[svc.toLowerCase() as Lowercase<LoginPlatform>] = exist;
                });
            }),
        );

        return {
            status: Status.Success,
            data: result,
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {}

type ResponseType = Record<Lowercase<LoginPlatform>, boolean>;
