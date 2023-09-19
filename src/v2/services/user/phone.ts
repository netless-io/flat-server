import { EntityManager } from "typeorm";
import { v4 } from "uuid";

import RedisService from "../../../thirdPartyService/RedisService";
import { PhoneSMS, Server } from "../../../constants/Config";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { createLoggerService } from "../../../logger";
import { hash } from "../../../utils/Hash";
import { RedisKey } from "../../../utils/Redis";
import { SMS, SMSUtils } from "../../../utils/SMS";
import { MessageExpirationSecond, MessageIntervalSecond } from "../../constants";
import { userDAO, userPhoneDAO } from "../../dao";
import { setGuidePPTX } from "./utils";
import { generateAvatar } from "../../../utils/Avatar";

export class UserPhoneService {
    private readonly logger = createLoggerService<"userPhone">({
        serviceName: "userPhone",
        ids: this.ids,
    });

    constructor(private readonly ids: IDS, private readonly DBTransaction: EntityManager) {}

    public async sendMessageForRegister(phone: string): Promise<void> {
        const sms = new SMS(phone);

        const safePhone = SMSUtils.safePhone(phone);

        if (await UserPhoneService.canSend(safePhone)) {
            const exist = await userPhoneDAO.findOne(this.DBTransaction, ["user_uuid"], {
                phone_number: phone,
            });
            if (exist) {
                throw new FError(ErrorCode.SMSAlreadyExist);
            }

            const success = await sms.send();
            if (!success) {
                throw new FError(ErrorCode.SMSFailedToSendCode);
            }

            await RedisService.set(
                RedisKey.phoneRegisterOrReset(safePhone),
                sms.verificationCode,
                MessageExpirationSecond,
            );
        } else {
            throw new FError(ErrorCode.ExhaustiveAttack);
        }
    }

    public async sendMessageForReset(phone: string): Promise<void> {
        const sms = new SMS(phone);

        const safePhone = SMSUtils.safePhone(phone);

        if (await UserPhoneService.canSend(safePhone)) {
            const user = await userPhoneDAO.findOne(this.DBTransaction, ["user_uuid"], {
                phone_number: phone,
            });
            if (!user) {
                throw new FError(ErrorCode.UserNotFound);
            }

            const success = await sms.send();
            if (!success) {
                throw new FError(ErrorCode.SMSFailedToSendCode);
            }

            await RedisService.set(
                RedisKey.phoneRegisterOrReset(safePhone),
                sms.verificationCode,
                MessageExpirationSecond,
            );
        } else {
            throw new FError(ErrorCode.ExhaustiveAttack);
        }
    }

    public async register(
        phone: string,
        code: number,
        password: string,
        jwtSign: (userUUID: string) => Promise<string>,
    ): Promise<PhoneRegisterReturn> {
        password = hash(password);

        const safePhone = SMSUtils.safePhone(phone);

        await UserPhoneService.notExhaustiveAttack(safePhone);
        await UserPhoneService.assertCodeCorrect(safePhone, code);
        await UserPhoneService.clearTryRegisterCount(safePhone);

        const userUUIDByPhone = await this.userUUIDByPhone(phone);
        if (userUUIDByPhone) {
            this.logger.info("register phone already exist", { userPhone: { phone } });
            throw new FError(ErrorCode.SMSAlreadyExist);
        }

        const userUUID = v4();
        const userName = safePhone.slice(-4);
        const avatarURL = generateAvatar(userUUID);

        const createUser = userDAO.insert(this.DBTransaction, {
            user_name: userName,
            user_uuid: userUUID,
            avatar_url: avatarURL,
            user_password: password,
        });

        const createUserPhone = userPhoneDAO.insert(this.DBTransaction, {
            user_name: userName,
            user_uuid: userUUID,
            phone_number: phone,
        });

        const setupGuidePPTX = setGuidePPTX(this.DBTransaction, userUUID);

        await Promise.all([createUser, createUserPhone, setupGuidePPTX]);

        const result: PhoneRegisterReturn = {
            name: userName,
            avatar: avatarURL,
            userUUID,
            token: await jwtSign(userUUID),
            hasPhone: true,
            hasPassword: true,
        };

        await UserPhoneService.clearVerificationCode(safePhone);

        return result;
    }

    public async reset(phone: string, code: number, password: string): Promise<void> {
        password = hash(password);

        const safePhone = SMSUtils.safePhone(phone);

        await UserPhoneService.notExhaustiveAttack(safePhone);
        await UserPhoneService.assertCodeCorrect(safePhone, code);
        await UserPhoneService.clearTryRegisterCount(safePhone);

        const userUUIDByPhone = await this.userUUIDByPhone(phone);
        if (!userUUIDByPhone) {
            this.logger.info("reset phone not found", { userPhone: { phone } });
            throw new FError(ErrorCode.UserNotFound);
        }

        await userDAO.update(
            this.DBTransaction,
            { user_password: password },
            { user_uuid: userUUIDByPhone },
        );

        await UserPhoneService.clearVerificationCode(safePhone);
    }

    public async login(
        phone: string,
        password: string,
        jwtSign: (userUUID: string) => Promise<string>,
    ): Promise<PhoneLoginReturn> {
        password = hash(password);

        const userUUIDByPhone = await this.userUUIDByPhone(phone);
        if (!userUUIDByPhone) {
            this.logger.info("login phone not found", { userPhone: { phone } });
            throw new FError(ErrorCode.UserOrPasswordIncorrect);
        }

        const user = await userDAO.findOne(
            this.DBTransaction,
            ["user_name", "avatar_url", "user_password"],
            { user_uuid: userUUIDByPhone },
        );
        if (!user) {
            this.logger.info("login phone not found user", {
                userPhone: { phone, userUUIDByPhone },
            });
            throw new FError(ErrorCode.UserOrPasswordIncorrect);
        }

        // User didn't set password, in this case we should not allow login with password
        if (!user.user_password) {
            this.logger.info("login phone user password is null", {
                userPhone: { phone, userUUIDByPhone },
            });
            throw new FError(ErrorCode.UserOrPasswordIncorrect);
        }

        if (user.user_password !== password) {
            this.logger.info("login phone user password incorrect", {
                userPhone: { phone, userUUIDByPhone },
            });
            throw new FError(ErrorCode.UserOrPasswordIncorrect);
        }

        return {
            name: user.user_name,
            avatar: user.avatar_url || generateAvatar(userUUIDByPhone),
            userUUID: userUUIDByPhone,
            token: await jwtSign(userUUIDByPhone),
            hasPhone: true,
            hasPassword: true,
        };
    }

    private async userUUIDByPhone(phone: string): Promise<string | null> {
        const result = await userPhoneDAO.findOne(this.DBTransaction, ["user_uuid"], {
            phone_number: phone,
        });

        return result ? result.user_uuid : null;
    }

    private static async canSend(safePhone: string): Promise<boolean> {
        const ttl = await RedisService.ttl(RedisKey.phoneRegisterOrReset(safePhone));

        if (ttl < 0) {
            return true;
        }

        const elapsedTime = MessageExpirationSecond - ttl;

        return elapsedTime > MessageIntervalSecond;
    }

    private static async assertCodeCorrect(safePhone: string, code: number): Promise<void> {
        if (Server.env === "dev") {
            for (const user of PhoneSMS.testUsers) {
                if (user.phone === safePhone && user.code === code) {
                    return;
                }
            }
        }

        const value = await RedisService.get(RedisKey.phoneRegisterOrReset(safePhone));

        if (String(code) !== value) {
            throw new FError(ErrorCode.SMSVerificationCodeInvalid);
        }
    }

    private static readonly ExhaustiveAttackCount = 10;

    private static async notExhaustiveAttack(safePhone: string): Promise<void> {
        const key = RedisKey.phoneTryRegisterOrResetCount(safePhone);
        const value = Number(await RedisService.get(key)) || 0;

        if (value > UserPhoneService.ExhaustiveAttackCount) {
            throw new FError(ErrorCode.ExhaustiveAttack);
        }

        const count = await RedisService.incr(key);

        if (count === 1) {
            // must re-wait 10 minutes
            await RedisService.expire(key, 60 * 10);
        }
    }

    private static async clearTryRegisterCount(safePhone: string): Promise<void> {
        await RedisService.del(RedisKey.phoneTryRegisterOrResetCount(safePhone));
    }

    private static async clearVerificationCode(safePhone: string): Promise<void> {
        await RedisService.del(RedisKey.phoneRegisterOrReset(safePhone));
    }
}

export type PhoneRegisterReturn = {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
    hasPhone: boolean;
    hasPassword: boolean;
};

export type PhoneLoginReturn = PhoneRegisterReturn;
