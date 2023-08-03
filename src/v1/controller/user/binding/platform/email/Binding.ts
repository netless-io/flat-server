import { Controller } from "../../../../../../decorator/Controller";
import { EmailSMS } from "../../../../../../constants/Config";
import { AbstractController } from "../../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../../types/Server";
import RedisService from "../../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../../utils/Redis";
import { ControllerError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";
import { Status } from "../../../../../../constants/Project";
import { ServiceUserEmail } from "../../../../../service/user/UserEmail";
import { UserDAO } from "../../../../../../dao";
import { ServiceUserSensitive } from "../../../../../service/user/UserSensitive";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: ["user/bindingEmail", "user/binding/platform/email"],
    auth: true,
    enable: EmailSMS.enable,
})
export class BindingEmail extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["email", "code"],
            properties: {
                email: {
                    type: "string",
                    format: "email",
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
        userEmail: new ServiceUserEmail(this.userUUID),
        userSensitive: new ServiceUserSensitive(this.userUUID),
    };

    private static ExhaustiveAttackCount = 10;

    public async execute(): Promise<Response<ResponseType>> {
        const { email, code } = this.body;

        await BindingEmail.notExhaustiveAttack(email);

        if (await this.svc.userEmail.exist()) {
            throw new ControllerError(ErrorCode.SMSAlreadyExist);
        }

        if (await this.svc.userEmail.existEmail(email)) {
            throw new ControllerError(ErrorCode.SMSAlreadyBinding);
        }

        await BindingEmail.assertCodeCorrect(email, code);
        await BindingEmail.clearTryBindingCount(email);

        const userInfo = await UserDAO().findOne(["user_name"], {
            user_uuid: this.userUUID,
        });

        if (userInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }

        await this.svc.userEmail.create({
            email,
        });
        await this.svc.userSensitive.email({
            email,
        });

        await BindingEmail.clearVerificationCode(email);

        return {
            status: Status.Success,
            data: {},
        };
    }

    private static async assertCodeCorrect(email: string, code: number): Promise<void> {
        const value = await RedisService.get(RedisKey.emailBinding(email));

        if (String(code) !== value) {
            throw new ControllerError(ErrorCode.SMSVerificationCodeInvalid);
        }
    }

    private static async notExhaustiveAttack(email: string): Promise<void> {
        const key = RedisKey.emailTryBindingCount(email);
        const value = Number(await RedisService.get(key)) || 0;

        if (value > BindingEmail.ExhaustiveAttackCount) {
            throw new ControllerError(ErrorCode.ExhaustiveAttack);
        }

        const incrValue = await RedisService.incr(key);

        if (incrValue === 1) {
            // must re-wait 10 minute
            await RedisService.expire(key, 60 * 10);
        }
    }

    private static async clearTryBindingCount(email: string): Promise<void> {
        await RedisService.del(RedisKey.emailTryBindingCount(email));
    }

    private static async clearVerificationCode(email: string): Promise<void> {
        await RedisService.del(RedisKey.emailBinding(email));
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        email: string;
        code: number;
    };
}

interface ResponseType {}
