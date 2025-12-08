import { Controller } from "../../../../decorator/Controller";
import { PhoneSMS } from "../../../../constants/Config";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { SMS, SMSUtils } from "../../../../utils/SMS";
import { Status } from "../../../../constants/Project";
import { MessageExpirationSecond, MessageIntervalSecond } from "./Constants";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { CaptchaClient } from "../../../../v2/services/captcha/ali-captcha-client";

@Controller<RequestType, any>({
    method: "post",
    path: "login/phone/sendMessage/captcha",
    auth: false,
    enable: PhoneSMS.enable,
    ipblock: true,
})
export class SendMessageCaptcha extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["phone"],
            properties: {
                phone: {
                    type: "string",
                    format: "phone",
                },
                captchaVerifyParam: {
                    type: "string",
                }
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { phone, captchaVerifyParam } = this.body;
        const sms = new SMS(phone);

        const safePhone = SMSUtils.safePhone(phone);

        if (await SendMessageCaptcha.canSend(safePhone)) {
            if (captchaVerifyParam) {
                try {
                    const captcha = await CaptchaClient.main(captchaVerifyParam);
                    if (!captcha) {
                        throw new ControllerError(ErrorCode.CaptchaInvalid);
                    }
                } catch (error) {
                    throw new ControllerError(ErrorCode.CaptchaFailed);
                }
            } else {
                throw new ControllerError(ErrorCode.CaptchaRequired);
            }
            const success = await sms.send();
            if (!success) {
                throw new ControllerError(ErrorCode.SMSFailedToSendCode);
            }
            await RedisService.set(
                RedisKey.phoneLogin(safePhone),
                sms.verificationCode,
                MessageExpirationSecond,
            );
        } else {
            this.logger.warn("count over limit");
            throw new ControllerError(ErrorCode.ExhaustiveAttack);
        }

        return {
            status: Status.Success,
            data: {},
        };
    }

    private static async canSend(phone: string): Promise<boolean> {
        const ttl = await RedisService.ttl(RedisKey.phoneLogin(phone));

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
        phone: string;
        captchaVerifyParam: string;
    };
}

interface ResponseType { }
