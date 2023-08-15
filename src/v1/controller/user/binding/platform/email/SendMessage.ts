import { Controller } from "../../../../../../decorator/Controller";
import { EmailSMS } from "../../../../../../constants/Config";
import { AbstractController } from "../../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../../types/Server";
import RedisService from "../../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../../utils/Redis";
import { Email, EmailUtils } from "../../../../../../utils/Email";
import { Status } from "../../../../../../constants/Project";
import { MessageExpirationSecond, MessageIntervalSecond } from "./Constants";
import { ServiceUserEmail } from "../../../../../service/user/UserEmail";
import { ControllerError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";

@Controller<RequestType, any>({
    method: "post",
    path: ["user/bindingEmail/sendMessage", "user/binding/platform/email/sendMessage"],
    auth: true,
    enable: EmailSMS.enable,
})
export class SendMessage extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["email"],
            properties: {
                email: {
                    type: "string",
                    format: "email",
                },
                language: {
                    type: "string",
                    nullable: true,
                },
            },
        },
    };

    private svc = {
        userEmail: new ServiceUserEmail(this.userUUID),
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { email, language } = this.body;

        const sms = new Email(email, {
            tagName: "bind",
            subject: EmailUtils.getSubject("bind", language),
            htmlBody: (email: string, code: string) =>
                EmailUtils.getMessage("bind", email, code, language),
        });

        if (await SendMessage.canSend(email)) {
            if (await this.svc.userEmail.exist()) {
                throw new ControllerError(ErrorCode.EmailAlreadyExist);
            }

            if (await this.svc.userEmail.existEmail(email)) {
                throw new ControllerError(ErrorCode.EmailAlreadyBinding);
            }

            const success = await sms.send();
            if (!success) {
                throw new ControllerError(ErrorCode.EmailFailedToSendCode);
            }

            await RedisService.set(
                RedisKey.emailBinding(email),
                sms.verificationCode,
                MessageExpirationSecond,
            );
        } else {
            this.logger.warn("count over limit");
        }

        return {
            status: Status.Success,
            data: {},
        };
    }

    private static async canSend(email: string): Promise<boolean> {
        const ttl = await RedisService.ttl(RedisKey.emailBinding(email));

        if (ttl < 0) {
            return true;
        }

        const elapsedTime = MessageExpirationSecond - ttl;

        return elapsedTime > MessageIntervalSecond;
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        email: string;
        language?: string;
    };
}

interface ResponseType {}
