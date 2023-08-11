import { Controller } from "../../../../decorator/Controller";
import { PhoneSMS, Server } from "../../../../constants/Config";
import { AbstractController } from "../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ServiceUserPhone } from "../../../service/user/UserPhone";
import { v4 } from "uuid";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { SMSUtils } from "../../../../utils/SMS";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { LoginPhone } from "../platforms/LoginPhone";
import { LoginPlatform, Status } from "../../../../constants/Project";
import { generateAvatar } from "../../../../utils/Avatar";

@Controller<RequestType, any>({
    method: "post",
    path: "login/phone",
    auth: false,
    enable: PhoneSMS.enable,
})
export class PhoneLogin extends AbstractController<RequestType, ResponseType> {
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

    private static ExhaustiveAttackCount = 10;

    public async execute(): Promise<Response<ResponseType>> {
        const { phone, code } = this.body;

        const safePhone = SMSUtils.safePhone(this.body.phone);

        await PhoneLogin.notExhaustiveAttack(safePhone);
        await PhoneLogin.assertCodeCorrect(safePhone, code);
        await PhoneLogin.clearTryLoginCount(safePhone);

        const userUUIDByDB = await ServiceUserPhone.userUUIDByPhone(phone);

        const userUUID = userUUIDByDB || v4();

        const loginPhone = new LoginPhone({
            userUUID,
        });

        if (!userUUIDByDB) {
            await loginPhone.register({
                phone,
                avatarURL: generateAvatar(userUUID),
            });
        }

        const { userName, avatarURL } = (await loginPhone.svc.user.nameAndAvatar())!;

        const result = {
            status: Status.Success,
            data: {
                name: userName,
                avatar: avatarURL,
                userUUID,
                token: await this.reply.jwtSign({
                    userUUID,
                    loginSource: LoginPlatform.Phone,
                }),
                hasPhone: true,
                hasPassword: await loginPhone.svc.user.hasPassword(),
            },
        } as const;

        await PhoneLogin.clearVerificationCode(safePhone);

        return result;
    }

    private static async assertCodeCorrect(safePhone: string, code: number): Promise<void> {
        if (Server.env === "dev") {
            for (const user of PhoneSMS.testUsers) {
                if (user.phone === safePhone && user.code === code) {
                    return;
                }
            }
        }

        const value = await RedisService.get(RedisKey.phoneLogin(safePhone));

        if (String(code) !== value) {
            throw new ControllerError(ErrorCode.SMSVerificationCodeInvalid);
        }
    }

    private static async notExhaustiveAttack(safePhone: string): Promise<void> {
        const key = RedisKey.phoneTryLoginCount(safePhone);
        const value = Number(await RedisService.get(key)) || 0;

        if (value > PhoneLogin.ExhaustiveAttackCount) {
            throw new ControllerError(ErrorCode.ExhaustiveAttack);
        }

        const inrcValue = await RedisService.incr(key);

        if (inrcValue === 1) {
            // must re-wait 10 minute
            await RedisService.expire(key, 60 * 10);
        }
    }

    private static async clearTryLoginCount(safePhone: string): Promise<void> {
        await RedisService.del(RedisKey.phoneTryLoginCount(safePhone));
    }

    private static async clearVerificationCode(safePhone: string): Promise<void> {
        await RedisService.del(RedisKey.phoneLogin(safePhone));
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

interface ResponseType {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
    hasPhone: true;
    hasPassword: boolean;
}
