import { EntityManager } from "typeorm";
import { v4 } from "uuid";

import RedisService from "../../../thirdPartyService/RedisService";
import { EmailSMS, Server } from "../../../constants/Config";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { createLoggerService } from "../../../logger";
import { Email, EmailUtils } from "../../../utils/Email";
import { hash } from "../../../utils/Hash";
import { RedisKey } from "../../../utils/Redis";
import { MessageExpirationSecond, MessageIntervalSecond } from "../../constants";
import { userDAO, userEmailDAO, userPhoneDAO } from "../../dao";
import { setGuidePPTX } from "./utils";
import { generateAvatar } from "../../../utils/Avatar";

export class UserEmailService {
    private readonly logger = createLoggerService<"userEmail">({
        serviceName: "userEmail",
        ids: this.ids,
    });

    constructor(private readonly ids: IDS, private readonly DBTransaction: EntityManager) {}

    public async sendMessageForRegister(email: string, language?: string): Promise<void> {
        const sms = new Email(email, {
            tagName: "register",
            subject: EmailUtils.getSubject("register", language),
            htmlBody: (email: string, code: string) =>
                EmailUtils.getMessage("register", email, code, language),
        });

        if (await UserEmailService.canSend(email)) {
            const exist = await userEmailDAO.findOne(this.DBTransaction, ["id"], {
                user_email: email,
            });
            if (exist) {
                throw new FError(ErrorCode.EmailAlreadyExist);
            }

            const success = await sms.send();
            if (!success) {
                throw new FError(ErrorCode.EmailFailedToSendCode);
            }

            await RedisService.set(
                RedisKey.emailRegisterOrReset(email),
                sms.verificationCode,
                MessageExpirationSecond,
            );
        } else {
            throw new FError(ErrorCode.ExhaustiveAttack);
        }
    }

    public async sendMessageForReset(email: string, language?: string): Promise<void> {
        const sms = new Email(email, {
            tagName: "reset",
            subject: EmailUtils.getSubject("reset", language),
            htmlBody: (email: string, code: string) =>
                EmailUtils.getMessage("reset", email, code, language),
        });

        if (await UserEmailService.canSend(email)) {
            const exist = await userEmailDAO.findOne(this.DBTransaction, ["id"], {
                user_email: email,
            });
            if (!exist) {
                throw new FError(ErrorCode.UserNotFound);
            }

            const success = await sms.send();
            if (!success) {
                throw new FError(ErrorCode.EmailFailedToSendCode);
            }

            await RedisService.set(
                RedisKey.emailRegisterOrReset(email),
                sms.verificationCode,
                MessageExpirationSecond,
            );
        } else {
            throw new FError(ErrorCode.ExhaustiveAttack);
        }
    }

    public async register(
        email: string,
        code: number,
        password: string,
        jwtSign: (userUUID: string) => Promise<string>,
    ): Promise<EmailRegisterReturn> {
        password = hash(password);

        await UserEmailService.notExhaustiveAttack(email);
        await UserEmailService.assertCodeCorrect(email, code);
        await UserEmailService.clearTryRegisterCount(email);

        const userUUIDByEmail = await this.userUUIDByEmail(email);
        if (userUUIDByEmail) {
            this.logger.info("register email already exist", { userEmail: { email } });
            throw new FError(ErrorCode.EmailAlreadyExist);
        }

        const userUUID = v4();
        const userName = email.split("@")[0];
        const avatarURL = generateAvatar(userUUID);

        const createUser = userDAO.insert(this.DBTransaction, {
            user_name: userName,
            user_uuid: userUUID,
            avatar_url: avatarURL,
            user_password: password,
        });

        const createUserEmail = userEmailDAO.insert(this.DBTransaction, {
            user_uuid: userUUID,
            user_email: email,
        });

        const setupGuidePPTX = setGuidePPTX(this.DBTransaction, userUUID);

        await Promise.all([createUser, createUserEmail, setupGuidePPTX]);

        const result: EmailRegisterReturn = {
            name: userName,
            avatar: avatarURL,
            userUUID,
            token: await jwtSign(userUUID),
            hasPhone: false,
            hasPassword: true,
        };

        await UserEmailService.clearVerificationCode(email);

        return result;
    }

    public async reset(email: string, code: number, password: string): Promise<void> {
        password = hash(password);

        await UserEmailService.notExhaustiveAttack(email);
        await UserEmailService.assertCodeCorrect(email, code);
        await UserEmailService.clearTryRegisterCount(email);

        const userUUIDByEmail = await this.userUUIDByEmail(email);
        if (!userUUIDByEmail) {
            this.logger.info("reset email not found", { userEmail: { email } });
            throw new FError(ErrorCode.UserNotFound);
        }

        await userDAO.update(
            this.DBTransaction,
            { user_password: password },
            { user_uuid: userUUIDByEmail },
        );

        await UserEmailService.clearVerificationCode(email);
    }

    public async login(
        email: string,
        password: string,
        jwtSign: (userUUID: string) => Promise<string>,
    ): Promise<EmailLoginReturn> {
        password = hash(password);

        const userUUIDByEmail = await this.userUUIDByEmail(email);
        if (!userUUIDByEmail) {
            this.logger.info("login email not found", { userEmail: { email } });
            throw new FError(ErrorCode.UserOrPasswordIncorrect);
        }

        const user = await userDAO.findOne(
            this.DBTransaction,
            ["user_name", "avatar_url", "user_password"],
            { user_uuid: userUUIDByEmail },
        );
        if (!user) {
            this.logger.info("login email not found user", {
                userEmail: { email, userUUIDByEmail },
            });
            throw new FError(ErrorCode.UserOrPasswordIncorrect);
        }

        if (!user.user_password) {
            this.logger.info("login email user password is null", {
                userEmail: { email, userUUIDByEmail },
            });
            throw new FError(ErrorCode.UserOrPasswordIncorrect);
        }

        if (user.user_password !== password) {
            this.logger.info("login email password incorrect", {
                userEmail: { email, userUUIDByEmail },
            });
            throw new FError(ErrorCode.UserOrPasswordIncorrect);
        }

        return {
            name: user.user_name,
            avatar: user.avatar_url || generateAvatar(userUUIDByEmail),
            userUUID: userUUIDByEmail,
            token: await jwtSign(userUUIDByEmail),
            hasPhone: await this.hasPhone(userUUIDByEmail),
            hasPassword: true,
        };
    }

    private async hasPhone(userUUID: string): Promise<boolean> {
        const exist = await userPhoneDAO.findOne(this.DBTransaction, ["id"], {
            user_uuid: userUUID,
        });
        return Boolean(exist);
    }

    private async userUUIDByEmail(email: string): Promise<string | null> {
        const result = await userEmailDAO.findOne(this.DBTransaction, ["user_uuid"], {
            user_email: email,
        });

        return result ? result.user_uuid : null;
    }

    private static async canSend(email: string): Promise<boolean> {
        const ttl = await RedisService.ttl(RedisKey.emailRegisterOrReset(email));

        if (ttl < 0) {
            return true;
        }

        const elapsedTime = MessageExpirationSecond - ttl;

        return elapsedTime > MessageIntervalSecond;
    }

    private static async assertCodeCorrect(email: string, code: number): Promise<void> {
        if (Server.env === "dev") {
            for (const user of EmailSMS.testEmails) {
                if (user.email === email && user.code === code) {
                    return;
                }
            }
        }

        const value = await RedisService.get(RedisKey.emailRegisterOrReset(email));

        if (String(code) !== value) {
            throw new FError(ErrorCode.EmailVerificationCodeInvalid);
        }
    }

    private static readonly ExhaustiveAttackCount = 10;

    private static async notExhaustiveAttack(email: string): Promise<void> {
        const key = RedisKey.emailTryRegisterOrResetCount(email);
        const value = Number(await RedisService.get(key)) || 0;

        if (value > UserEmailService.ExhaustiveAttackCount) {
            throw new FError(ErrorCode.ExhaustiveAttack);
        }

        const count = await RedisService.incr(key);

        if (count === 1) {
            // must re-wait 10 minutes
            await RedisService.expire(key, 60 * 10);
        }
    }

    private static async clearTryRegisterCount(email: string): Promise<void> {
        await RedisService.del(RedisKey.emailTryRegisterOrResetCount(email));
    }

    private static async clearVerificationCode(email: string): Promise<void> {
        await RedisService.del(RedisKey.emailRegisterOrReset(email));
    }
}

export type EmailRegisterReturn = {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
    hasPhone: boolean;
    hasPassword: boolean;
};

export type EmailLoginReturn = EmailRegisterReturn;
