import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";
import { ServiceUserPhone } from "../../../service/user/UserPhone";
import { ServiceUserAgora } from "../../../service/user/UserAgora";
import { ServiceUserApple } from "../../../service/user/UserApple";
import { ServiceUserGithub } from "../../../service/user/UserGithub";
import { ServiceUserGoogle } from "../../../service/user/UserGoogle";
import { ServiceUserEmail } from "../../../service/user/UserEmail";
import { LoginPlatform, Status } from "../../../../constants/Project";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/binding/remove",
    auth: true,
})
export class RemoveBinding extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["target"],
            properties: {
                target: {
                    type: "string",
                    enum: [
                        LoginPlatform.WeChat,
                        LoginPlatform.Phone,
                        LoginPlatform.Agora,
                        LoginPlatform.Apple,
                        LoginPlatform.Github,
                        LoginPlatform.Google,
                        LoginPlatform.Email,
                    ],
                },
            },
        },
    };

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
        await this.svc[this.body.target].assertExist();

        const { count, remaining } = await this.bindingInfo();

        if (count === 1) {
            throw new ControllerError(ErrorCode.UnsupportedOperation);
        }

        await this.svc[this.body.target].physicalDeletion();

        const jwtToken = await this.reply.jwtSign({
            userUUID: this.userUUID,
            loginSource: remaining,
        });

        return {
            status: Status.Success,
            data: {
                token: jwtToken,
            },
        };
    }

    private async bindingInfo(): Promise<{ count: number; remaining: LoginPlatform }> {
        let count = 0;
        let remaining = LoginPlatform.Apple;

        await Promise.all(
            Object.keys(this.svc).map(svc => {
                return this.svc[svc as LoginPlatform].exist().then(result => {
                    if (result) {
                        count += 1;
                        remaining = svc as LoginPlatform;
                    }
                });
            }),
        );

        return {
            count,
            remaining,
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        target: LoginPlatform;
    };
}

interface ResponseType {
    token: string;
}
