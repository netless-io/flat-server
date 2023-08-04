import * as OpenApi from "@alicloud/openapi-client";
import DysmsAPI20170525, { SendSmsRequest } from "@alicloud/dysmsapi20170525";
import { PhoneSMS } from "../constants/Config";
import { customAlphabet } from "nanoid";
import { createLoggerSMS, Logger, parseError } from "../logger";
import { LoggerSMS } from "../logger/LogConext";

export class SMSUtils {
    private static nanoID = customAlphabet("0123456789", 6);

    public static isChineseMainland(phone: string): boolean {
        return phone.startsWith("+86");
    }

    public static isHMT(phone: string): boolean {
        return phone.startsWith("+852") || phone.startsWith("+853") || phone.startsWith("+886");
    }

    public static safePhone(phone: string): string {
        return phone.match(/\d+/g)!.join("");
    }

    public static verificationCode(): string {
        const code = SMSUtils.nanoID();

        if (code[0] === "0") {
            return SMSUtils.verificationCode();
        }

        return code;
    }
}

class SMSClients {
    private static clients = {
        chineseMainland: new DysmsAPI20170525(
            new OpenApi.Config({
                accessKeyId: PhoneSMS.chineseMainland.accessId,
                accessKeySecret: PhoneSMS.chineseMainland.accessSecret,
                endpoint: "dysmsapi.aliyuncs.com",
            }),
        ),
        hmt: new DysmsAPI20170525(
            new OpenApi.Config({
                accessKeyId: PhoneSMS.hmt.accessId,
                accessKeySecret: PhoneSMS.hmt.accessSecret,
                endpoint: "dysmsapi.aliyuncs.com",
            }),
        ),
        global: new DysmsAPI20170525(
            new OpenApi.Config({
                accessKeyId: PhoneSMS.global.accessId,
                accessKeySecret: PhoneSMS.global.accessSecret,
                endpoint: "dysmsapi.aliyuncs.com",
            }),
        ),
    };

    public constructor(private phone: string) {}

    public client(): DysmsAPI20170525 {
        if (SMSUtils.isChineseMainland(this.phone)) {
            return SMSClients.clients.chineseMainland;
        }

        if (SMSUtils.isHMT(this.phone)) {
            return SMSClients.clients.hmt;
        }

        return SMSClients.clients.global;
    }
}

export class SMS {
    private client: DysmsAPI20170525;

    public verificationCode = SMSUtils.verificationCode();
    private logger = this.createLoggerSMS();

    public constructor(private phone: string) {
        this.client = new SMSClients(this.phone).client();
    }

    public async send(): Promise<boolean> {
        const { templateCode, signName } = SMS.info(this.phone);

        this.logger.debug("ready send message");

        const resp = await this.client
            .sendSms(
                new SendSmsRequest({
                    phoneNumbers: this.phone,
                    signName,
                    templateCode,
                    templateParam: `{"code": "${this.verificationCode}"}`,
                }),
            )
            .catch(error => {
                this.logger.error("send message error", parseError(error));
                return null;
            });

        if (resp === null || resp.body.code === undefined) {
            return false;
        }

        this.logger.withContext({
            smsDetail: {
                // see: https://help.aliyun.com/document_detail/101346.html
                code: resp.body.code || "",
                message: resp.body.message || "",
                bizId: resp.body.bizId || "",
                requestId: resp.body.requestId || "",
            },
        });

        if (resp.body.code !== "OK") {
            this.logger.error("send message failed");
            return false;
        } else {
            this.logger.debug("send message success");
            return true;
        }
    }

    private static info(phone: string): typeof PhoneSMS["hmt"] {
        if (SMSUtils.isChineseMainland(phone)) {
            return PhoneSMS.chineseMainland;
        }

        if (SMSUtils.isHMT(phone)) {
            return PhoneSMS.hmt;
        }

        return PhoneSMS.global;
    }

    private createLoggerSMS(): Logger<LoggerSMS> {
        const { templateCode, signName } = SMS.info(this.phone);

        return createLoggerSMS({
            sms: {
                phoneNumbers: this.phone,
                signName,
                templateCode,
                verificationCode: this.verificationCode,
            },
        });
    }
}
