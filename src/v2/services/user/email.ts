import { EntityManager } from "typeorm";
import { v4 } from "uuid";

import RedisService from "../../../thirdPartyService/RedisService";
import { EmailSMS, Server } from "../../../constants/Config";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { createLoggerService } from "../../../logger";
import { Email } from "../../../utils/Email";
import { hash } from "../../../utils/Hash";
import { RedisKey } from "../../../utils/Redis";
import { MessageExpirationSecond, MessageIntervalSecond } from "../../constants";
import { userDAO, userEmailDAO, userPhoneDAO } from "../../dao";
import { setGuidePPTX } from "./utils";

export class UserEmailService {
    private readonly logger = createLoggerService<"userEmail">({
        serviceName: "userEmail",
        ids: this.ids,
    });

    constructor(private readonly ids: IDS, private readonly DBTransaction: EntityManager) {}

    public async sendMessageForRegister(email: string, language?: string): Promise<void> {
        const sms = new Email(email, {
            tagName: "register",
            subject: this.getSubject("register", language),
            htmlBody: (email: string, code: string) =>
                this.getMessage("register", email, code, language),
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
            subject: this.getSubject("reset", language),
            htmlBody: (email: string, code: string) =>
                this.getMessage("reset", email, code, language),
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

        const createUser = userDAO.insert(this.DBTransaction, {
            user_name: userName,
            user_uuid: userUUID,
            avatar_url: "",
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
            avatarURL: "",
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
            avatarURL: user.avatar_url,
            userUUID: userUUIDByEmail,
            token: await jwtSign(userUUIDByEmail),
            hasPhone: await this.hasPhone(userUUIDByEmail),
            hasPassword: true,
        };
    }

    private getSubject(_type: "register" | "reset", language?: string): string {
        if (language && language.startsWith("zh")) {
            return "Flat 验证码";
        } else {
            return "Flat Verification Code";
        }
    }

    private getMessage(
        type: "register" | "reset" | "bind",
        email: string,
        code: string,
        language?: string,
    ): string {
        if (language && language.startsWith("zh")) {
            if (type === "register") {
                return `${email}，你好！<br><br>感谢注册 <a href="http://flat.whiteboard.agora.io/">Flat 在线教室</a>，请在10分钟内输入验证码：<br><br><h1 style="text-align:center">${code}</h1><br><br>Flat 是一款开源的在线授课软件，专为个人老师设计。我们努力克制保持简单、清爽、专注课中互动体验，希望可以给你带来愉悦的上课体验。<br><br>目前 Flat 正在积极开发中，如果你在使用过程中遇到问题，欢迎联系我进行反馈。它在一天天长大，我们很高兴与你分享这份喜悦。<br><br>Leo Yang<br>Flat 产品经理<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`;
            } else {
                return `${email}，你好！请在10分钟内输入验证码：<br><br><h1 style="text-align:center">${code}</h1><br><br>目前 Flat 正在积极开发中，如果你在使用过程中遇到问题，欢迎联系我进行反馈。它在一天天长大，我们很高兴与你分享这份喜悦。<br><br>Leo Yang<br>Flat 产品经理<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`;
            }
        } else {
            if (type === "register") {
                return `Hello, ${email}! <br><br>Thank you for registering with <a href="http://flat.whiteboard.agora.io/">Flat Online Classroom</a>. Please enter the verification code within 10 minutes:<br><br><h1 style="text-align:center">${code}</h1><br><br>Flat is an open-source online teaching software designed specifically for freelance teachers. We strive to maintain a simple, refreshing, and focused in-class interactive experience, aiming to provide you with a pleasant teaching experience.<br><br>Currently, Flat is actively under development. If you encounter any issues during usage, please feel free to contact me for feedback. It is growing day by day, and we are delighted to share this joy with you.<br><br>Thanks and Regards,<br>Leo Yang<br>Flat PM<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`;
            } else {
                return `Hello, ${email}! Please enter the verification code within 10 minutes:<br><br><h1 style="text-align:center">${code}</h1><br><br><Currently, Flat is actively under development. If you encounter any issues during usage, please feel free to contact me for feedback. It is growing day by day, and we are delighted to share this joy with you.<br><br>Thanks and Regards,<br>Leo Yang<br>Flat PM<br><a href="mailto:yangliu02@agora.io">yangliu02@agora.io</a>`;
            }
        }
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
    avatarURL: string;
    userUUID: string;
    token: string;
    hasPhone: boolean;
    hasPassword: boolean;
};

export type EmailLoginReturn = EmailRegisterReturn;
