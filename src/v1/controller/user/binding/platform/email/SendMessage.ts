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
            subject: this.getSubject(language),
            htmlBody: (email: string, code: string) =>
                this.getMessage("bind", email, code, language),
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

    private getSubject(language?: string): string {
        if (language && language.startsWith("zh")) {
            return "Flat 验证码";
        } else {
            return "Flat Verification Code";
        }
    }

    private getMessage(
        type: "register" | "reset" | "bind",
        email: string,
        code: string,
        language?: string,
    ): string {
        const name = email.split("@")[0];
        if (language && language.startsWith("zh")) {
            if (type === "register") {
                return `${name}，你好！<br><br>感谢注册 <a href="http://flat.whiteboard.agora.io/">Flat 在线教室</a>，请在10分钟内输入验证码：<br><br><h1 style="text-align:center">${code}</h1><br><br>Flat 是一款<a href="https://github.com/netless-io/flat">开源</a>的在线授课软件，专为个人老师设计。我们努力克制保持简单、清爽、专注课中互动体验，希望可以给你带来愉悦的上课体验。<br><br>目前 Flat 正在积极开发中，如果你在使用过程中遇到问题，欢迎联系我进行反馈。它在一天天长大，我们很高兴与你分享这份喜悦。<br><br>Leo Yang<br>Flat 产品经理<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`;
            } else {
                return `${name}，你好！请在10分钟内输入验证码：<br><br><h1 style="text-align:center">${code}</h1><br><br>目前 Flat 正在积极开发中，如果你在使用过程中遇到问题，欢迎联系我进行反馈。它在一天天长大，我们很高兴与你分享这份喜悦。<br><br>Leo Yang<br>Flat 产品经理<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`;
            }
        } else {
            if (type === "register") {
                return `Hello, ${name}! <br><br>Thank you for registering with <a href="http://flat.whiteboard.agora.io/">Flat Online Classroom</a>. Please enter the verification code within 10 minutes:<br><br><h1 style="text-align:center">${code}</h1><br><br>Flat is an <a href="https://github.com/netless-io/flat">open-source</a> online teaching software designed specifically for freelance teachers. We strive to maintain a simple, refreshing, and focused in-class interactive experience, aiming to provide you with a pleasant teaching experience.<br><br>Currently, Flat is actively under development. If you encounter any issues during usage, please feel free to contact me for feedback. It is growing day by day, and we are delighted to share this joy with you.<br><br>Thanks and Regards,<br>Leo Yang<br>Flat PM<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`;
            } else {
                return `Hello, ${name}! Please enter the verification code within 10 minutes:<br><br><h1 style="text-align:center">${code}</h1><br><br><Currently, Flat is actively under development. If you encounter any issues during usage, please feel free to contact me for feedback. It is growing day by day, and we are delighted to share this joy with you.<br><br>Thanks and Regards,<br>Leo Yang<br>Flat PM<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`;
            }
        }
    }
}

interface RequestType {
    body: {
        email: string;
        language?: string;
    };
}

interface ResponseType {}
