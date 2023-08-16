import Dm20151123, { SingleSendMailRequest, SingleSendMailResponse } from "@alicloud/dm20151123";
import { Config } from "@alicloud/openapi-client";
import { RuntimeOptions } from "@alicloud/tea-util";
import { createTransport, Transporter } from "nodemailer";
import { EmailSMS } from "../constants/Config";
import { SMSUtils } from "./SMS";
import { createLoggerEmail, Logger, parseError } from "../logger";
import { LoggerEmail } from "../logger/LogConext";

interface EmailClient {
    send(
        tag: string,
        to: string,
        subject: string,
        body: string,
        logger: Logger<LoggerEmail>,
    ): Promise<boolean>;
}

function createAliCloudClient(): EmailClient {
    const config = new Config({
        accessKeyId: EmailSMS.aliCloud.accessId,
        accessKeySecret: EmailSMS.aliCloud.accessSecret,
    });
    config.endpoint = "dm.aliyuncs.com";

    const client = new Dm20151123(config);

    return {
        async send(tagName, toAddress, subject, htmlBody, logger) {
            const request = new SingleSendMailRequest({
                accountName: EmailSMS.aliCloud.accountName,
                addressType: 1,
                tagName,
                replyToAddress: true,
                toAddress,
                subject,
                htmlBody,
            });

            const runtime = new RuntimeOptions({});

            let resp: SingleSendMailResponse;
            try {
                resp = await client.singleSendMailWithOptions(request, runtime);
            } catch (error) {
                logger.error("send message error", parseError(error));
                return false;
            }

            logger.withContext({
                emailDetail: {
                    envId: resp.body.envId || "",
                    requestId: resp.body.requestId || "",
                    messageId: "",
                },
            });

            if (200 <= resp.statusCode && resp.statusCode < 300) {
                logger.debug("send message success");
                return true;
            } else {
                logger.error("send message failed");
                return false;
            }
        },
    };
}

function createSMTPTransport(): EmailClient {
    const transport = createTransport({
        host: EmailSMS.smtp.host,
        port: EmailSMS.smtp.port,
        secure: EmailSMS.smtp.secure,
        auth: {
            user: EmailSMS.smtp.auth.user,
            pass: EmailSMS.smtp.auth.pass,
        },
    });

    return {
        async send(_tag, to, subject, html, logger) {
            type ExtractResponse<T> = T extends Transporter<infer K> ? K : never;

            let resp: ExtractResponse<typeof transport>;

            try {
                resp = await transport.sendMail({
                    from: EmailSMS.smtp.auth.user,
                    to,
                    subject,
                    html,
                });
            } catch (error) {
                logger.error("send message error", parseError(error));
                return false;
            }

            logger.withContext({
                emailDetail: {
                    envId: "",
                    requestId: "",
                    messageId: resp.messageId || "",
                },
            });

            logger.debug("send message success: " + resp.response);
            return true;
        },
    };
}

function createEmailClient(): EmailClient {
    if (EmailSMS.type === "smtp") {
        return createSMTPTransport();
    }
    if (EmailSMS.type === "aliCloud") {
        return createAliCloudClient();
    }
    throw new Error(`unknown email type: ${EmailSMS.type}`);
}

function getAccountName(): string {
    if (EmailSMS.type === "aliCloud") {
        return EmailSMS.aliCloud.accountName;
    }
    if (EmailSMS.type === "smtp") {
        return EmailSMS.smtp.auth.user;
    }
    throw new Error(`unknown email type: ${EmailSMS.type}`);
}

export class Email {
    private static client: EmailClient = createEmailClient();

    public verificationCode = SMSUtils.verificationCode();
    private logger = this.createLoggerEmail();

    public constructor(
        private email: string,
        private options: {
            tagName?: string;
            subject?: string;
            htmlBody?: (email: string, verificationCode: string) => string;
        } = {},
    ) {}

    public send(): Promise<boolean> {
        const {
            tagName = "register",
            subject = "Verification Code",
            htmlBody = (_email, code) => `Your verification code is <b>${code}</b>`,
        } = this.options;

        this.logger.debug("ready send message");

        return Email.client.send(
            tagName,
            this.email,
            subject,
            htmlBody(this.email, this.verificationCode),
            this.logger,
        );
    }

    private createLoggerEmail(): Logger<LoggerEmail> {
        return createLoggerEmail({
            email: {
                accountName: getAccountName(),
                email: this.email,
                verificationCode: this.verificationCode,
            },
        });
    }
}

export class EmailUtils {
    public static getSubject(_type: "register" | "reset" | "bind", language?: string): string {
        if (language && language.startsWith("zh")) {
            return "Flat 验证码";
        } else {
            return "Flat Verification Code";
        }
    }

    public static getMessage(
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
