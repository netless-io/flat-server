import { Controller } from "../../../../../../decorator/Controller";
import { EmailSMS } from "../../../../../../constants/Config";
import { AbstractController } from "../../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../../types/Server";
import RedisService from "../../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../../utils/Redis";
import { Email } from "../../../../../../utils/Email";
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
            },
        },
    };

    private svc = {
        userEmail: new ServiceUserEmail(this.userUUID),
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { email } = this.body;
        const sms = new Email(email, {
            tagName: "bind",
            subject: "Flat Verification Code",
            htmlBody: (email: string, code: string) =>
                `Hello, ${email}! Please enter the verification code within 10 minutes:<br><br><h1 style="text-align:center">${code}</h1><br><br><Currently, Flat is actively under development. If you encounter any issues during usage, please feel free to contact me for feedback. It is growing day by day, and we are delighted to share this joy with you.<br><br>Thanks and Regards,<br>Leo Yang<br>Flat PM<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`,
        });

        if (await SendMessage.canSend(email)) {
            if (await this.svc.userEmail.exist()) {
                throw new ControllerError(ErrorCode.SMSAlreadyExist);
            }

            if (await this.svc.userEmail.existEmail(email)) {
                throw new ControllerError(ErrorCode.SMSAlreadyBinding);
            }

            const success = await sms.send();
            if (!success) {
                throw new ControllerError(ErrorCode.SMSFailedToSendCode);
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
    };
}

interface ResponseType {}
