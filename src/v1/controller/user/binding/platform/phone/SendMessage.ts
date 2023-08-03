import { Controller } from "../../../../../../decorator/Controller";
import { PhoneSMS } from "../../../../../../constants/Config";
import { AbstractController } from "../../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../../types/Server";
import RedisService from "../../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../../utils/Redis";
import { SMS, SMSUtils } from "../../../../../../utils/SMS";
import { Status } from "../../../../../../constants/Project";
import { MessageExpirationSecond, MessageIntervalSecond } from "./Constants";
import { ServiceUserPhone } from "../../../../../service/user/UserPhone";
import { ControllerError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";

@Controller<RequestType, any>({
    method: "post",
    path: ["user/bindingPhone/sendMessage", "user/binding/platform/phone/sendMessage"],
    auth: true,
    enable: PhoneSMS.enable,
})
export class SendMessage extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["phone"],
            properties: {
                phone: {
                    type: "string",
                    format: "phone",
                },
            },
        },
    };

    private svc = {
        userPhone: new ServiceUserPhone(this.userUUID),
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { phone } = this.body;
        const sms = new SMS(phone);

        const safePhone = SMSUtils.safePhone(phone);

        if (await SendMessage.canSend(safePhone)) {
            if (await this.svc.userPhone.exist()) {
                throw new ControllerError(ErrorCode.SMSAlreadyExist);
            }

            if (await this.svc.userPhone.existPhone(phone)) {
                throw new ControllerError(ErrorCode.SMSAlreadyBinding);
            }

            const success = await sms.send();
            if (!success) {
                throw new ControllerError(ErrorCode.SMSFailedToSendCode);
            }

            await RedisService.set(
                RedisKey.phoneBinding(safePhone),
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

    private static async canSend(phone: string): Promise<boolean> {
        const ttl = await RedisService.ttl(RedisKey.phoneBinding(phone));

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
    };
}

interface ResponseType {}
