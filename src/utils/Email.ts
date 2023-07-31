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
    ): Promise<void>;
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
                return;
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
            } else {
                logger.error("send message failed");
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
                return;
            }

            logger.withContext({
                emailDetail: {
                    envId: "",
                    requestId: "",
                    messageId: resp.messageId || "",
                },
            });

            logger.debug("send message success: " + resp.response);
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

    public async send(): Promise<void> {
        const {
            tagName = "register",
            subject = "Verification Code",
            htmlBody = (_email, code) => `Your verification code is <b>${code}</b>`,
        } = this.options;

        this.logger.debug("ready send message");

        await Email.client.send(
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
