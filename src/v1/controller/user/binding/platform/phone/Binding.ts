import { Controller } from "../../../../../../decorator/Controller";
import { PhoneSMS } from "../../../../../../constants/Config";
import { AbstractController } from "../../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../../types/Server";
import RedisService from "../../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../../utils/Redis";
import { SMSUtils } from "../../../../../../utils/SMS";
import { ControllerError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";
import { Status } from "../../../../../../constants/Project";
import { ServiceUserPhone } from "../../../../../service/user/UserPhone";
import { UserDAO } from "../../../../../../dao";
import { ServiceUserSensitive } from "../../../../../service/user/UserSensitive";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: ["user/bindingPhone", "user/binding/platform/phone"],
    auth: true,
    enable: PhoneSMS.enable,
})
export class BindingPhone extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["phone", "code"],
            properties: {
                phone: {
                    type: "string",
                    format: "phone",
                },
                code: {
                    type: "integer",
                    minimum: 100000,
                    maximum: 999999,
                },
            },
        },
    };

    private svc = {
        userPhone: new ServiceUserPhone(this.userUUID),
        userSensitive: new ServiceUserSensitive(this.userUUID),
    };

    private static ExhaustiveAttackCount = 10;

    public async execute(): Promise<Response<ResponseType>> {
        const { phone, code } = this.body;

        const safePhone = SMSUtils.safePhone(phone);

        await BindingPhone.notExhaustiveAttack(safePhone);

        if (await this.svc.userPhone.exist()) {
            throw new ControllerError(ErrorCode.SMSAlreadyExist);
        }

        if (await this.svc.userPhone.existPhone(phone)) {
            throw new ControllerError(ErrorCode.SMSAlreadyBinding);
        }

        await BindingPhone.assertCodeCorrect(safePhone, code);
        await BindingPhone.clearTryBindingCount(safePhone);

        const userInfo = await UserDAO().findOne(["user_name"], {
            user_uuid: this.userUUID,
        });

        if (userInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }

        await this.svc.userPhone.create({
            phone,
            userName: userInfo.user_name,
        });
        await this.svc.userSensitive.phone({
            phone,
        });

        await BindingPhone.clearVerificationCode(safePhone);

        return {
            status: Status.Success,
            data: {},
        };
    }

    private static async assertCodeCorrect(safePhone: string, code: number): Promise<void> {
        const value = await RedisService.get(RedisKey.phoneBinding(safePhone));

        if (String(code) !== value) {
            throw new ControllerError(ErrorCode.SMSVerificationCodeInvalid);
        }
    }

    private static async notExhaustiveAttack(safePhone: string): Promise<void> {
        const key = RedisKey.phoneTryBindingCount(safePhone);
        const value = Number(await RedisService.get(key)) || 0;

        if (value > BindingPhone.ExhaustiveAttackCount) {
            throw new ControllerError(ErrorCode.ExhaustiveAttack);
        }

        const inrcValue = await RedisService.incr(key);

        if (inrcValue === 1) {
            // must re-wait 10 minute
            await RedisService.expire(key, 60 * 10);
        }
    }

    private static async clearTryBindingCount(safePhone: string): Promise<void> {
        await RedisService.del(RedisKey.phoneTryBindingCount(safePhone));
    }

    private static async clearVerificationCode(safePhone: string): Promise<void> {
        await RedisService.del(RedisKey.phoneBinding(safePhone));
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        phone: string;
        code: number;
    };
}

interface ResponseType {}
