import { EntityManager } from "typeorm";

import RedisService from "../../../thirdPartyService/RedisService";
import { alreadyJoinedRoomCount } from "../../../v1/controller/user/deleteAccount/utils/AlreadyJoinedRoomCount";

import { LoginPlatform } from "../../../constants/Project";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { createLoggerService, parseError } from "../../../logger";
import { UserAgoraModel } from "../../../model/user/Agora";
import { UserAppleModel } from "../../../model/user/Apple";
import { UserEmailModel } from "../../../model/user/Email";
import { UserGithubModel } from "../../../model/user/Github";
import { UserGoogleModel } from "../../../model/user/Google";
import { UserPhoneModel } from "../../../model/user/Phone";
import { UserModel } from "../../../model/user/User";
import { UserWeChatModel } from "../../../model/user/WeChat";
import { RedisKey } from "../../../utils/Redis";
import { SMS, SMSUtils } from "../../../utils/SMS";
import {
    DAO,
    roomDAO,
    roomUserDAO,
    userAgoraDAO,
    userAppleDAO,
    userDAO,
    userEmailDAO,
    userGithubDAO,
    userGoogleDAO,
    userPhoneDAO,
    userSensitiveDAO,
    userWeChatDAO,
} from "../../dao";
import { generateAvatar } from "../../../utils/Avatar";
import { RoomStatus } from "../../../model/room/Constants";

type UserPlatform =
    | UserModel
    | UserPhoneModel
    | UserEmailModel
    | UserWeChatModel
    | UserGithubModel
    | UserAppleModel
    | UserAgoraModel
    | UserGoogleModel;

type RebindStatusKey = Lowercase<Exclude<LoginPlatform, LoginPlatform.Phone>>;
enum RebindStatusVal {
    NotChanged = -1,
    Success = 0,
    Failed = 1,
}
type RebindStatus = Record<RebindStatusKey, RebindStatusVal>;

export const MessageIntervalSecond = 60;
export const MessageExpirationSecond = 60 * 10;

export class UserRebindPhoneService {
    private readonly logger = createLoggerService<"rebindPhone">({
        serviceName: "rebindPhone",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async sendMessage(phone: string): Promise<void> {
        const sms = new SMS(phone);

        const safePhone = SMSUtils.safePhone(phone);

        if (await UserRebindPhoneService.canSend(safePhone)) {
            if (await this.exists(userPhoneDAO, this.userUUID)) {
                throw new FError(ErrorCode.SMSAlreadyExist);
            }

            const original = await userPhoneDAO.findOne(this.DBTransaction, ["id"], {
                phone_number: phone,
            });
            if (!original) {
                this.logger.info("not found user by phone", { rebindPhone: { phone, safePhone } });
                throw new FError(ErrorCode.UserNotFound);
            }

            const success = await sms.send();
            if (!success) {
                throw new FError(ErrorCode.SMSFailedToSendCode);
            }

            await RedisService.set(
                RedisKey.phoneBinding(safePhone),
                sms.verificationCode,
                MessageExpirationSecond,
            );
        } else {
            throw new FError(ErrorCode.ExhaustiveAttack);
        }
    }

    public async rebind(
        phone: string,
        code: number,
        jwtSign: (userUUID: string) => Promise<string>,
    ): Promise<UserRebindReturn> {
        const safePhone = SMSUtils.safePhone(phone);
        await UserRebindPhoneService.notExhaustiveAttack(safePhone);

        const joinedRoomCount = await alreadyJoinedRoomCount(this.userUUID, this.DBTransaction);
        if (joinedRoomCount > 0) {
            this.logger.info("user has room", { rebindPhone: { userUUID: this.userUUID } });
            await Promise.all([
                roomUserDAO.delete(this.DBTransaction, {
                    user_uuid: this.userUUID,
                }),
                roomDAO.update(
                    this.DBTransaction,
                    { room_status: RoomStatus.Stopped, end_time: new Date() },
                    { owner_uuid: this.userUUID },
                ),
            ]);
        }

        const exist = await this.exists(userDAO, this.userUUID);
        if (!exist) {
            this.logger.info("not found user", { rebindPhone: { userUUID: this.userUUID } });
            throw new FError(ErrorCode.UserNotFound);
        }

        const existPhone = await this.exists(userPhoneDAO, this.userUUID);
        if (existPhone) {
            this.logger.info("user has phone", { rebindPhone: { userUUID: this.userUUID } });
            throw new FError(ErrorCode.SMSAlreadyBinding);
        }

        const original = await userPhoneDAO.findOne(this.DBTransaction, ["user_uuid"], {
            phone_number: phone,
        });
        if (!original) {
            this.logger.info("not found user by phone", { rebindPhone: { phone, safePhone } });
            throw new FError(ErrorCode.UserNotFound);
        }

        await UserRebindPhoneService.assertCodeCorrect(safePhone, code);
        await UserRebindPhoneService.clearTryBindingCount(safePhone);

        // Move binding data from this.userUUID to original.user_uuid
        const status: RebindStatus = {
            agora: RebindStatusVal.NotChanged,
            apple: RebindStatusVal.NotChanged,
            github: RebindStatusVal.NotChanged,
            google: RebindStatusVal.NotChanged,
            wechat: RebindStatusVal.NotChanged,
            email: RebindStatusVal.NotChanged,
        };

        await this.tryUpdate(userAgoraDAO, original.user_uuid, status, LoginPlatform.Agora);
        await this.tryUpdate(userAppleDAO, original.user_uuid, status, LoginPlatform.Apple);
        await this.tryUpdate(userGithubDAO, original.user_uuid, status, LoginPlatform.Github);
        await this.tryUpdate(userGoogleDAO, original.user_uuid, status, LoginPlatform.Google);
        await this.tryUpdate(userWeChatDAO, original.user_uuid, status, LoginPlatform.WeChat);
        await this.tryUpdate(userEmailDAO, original.user_uuid, status, LoginPlatform.Email);

        // Delete account of this.userUUID
        await Promise.all([
            userDAO.deleteHard(this.DBTransaction, { user_uuid: this.userUUID }),
            userAgoraDAO.deleteHard(this.DBTransaction, { user_uuid: this.userUUID }),
            userAppleDAO.deleteHard(this.DBTransaction, { user_uuid: this.userUUID }),
            userGithubDAO.deleteHard(this.DBTransaction, { user_uuid: this.userUUID }),
            userGoogleDAO.deleteHard(this.DBTransaction, { user_uuid: this.userUUID }),
            userPhoneDAO.deleteHard(this.DBTransaction, { user_uuid: this.userUUID }),
            userWeChatDAO.deleteHard(this.DBTransaction, { user_uuid: this.userUUID }),
            userEmailDAO.deleteHard(this.DBTransaction, { user_uuid: this.userUUID }),
        ]);

        await RedisService.set(RedisKey.userDelete(this.userUUID), "").catch(error => {
            this.logger.warn("set userDelete failed", parseError(error));
        });

        // Login with original.user_uuid
        const result = await userDAO.findOne(this.DBTransaction, ["user_name", "avatar_url"], {
            user_uuid: original.user_uuid,
        });

        await UserRebindPhoneService.clearVerificationCode(safePhone);

        if (result) {
            return {
                name: result.user_name,
                avatar: result.avatar_url || generateAvatar(original.user_uuid),
                userUUID: original.user_uuid,
                token: await jwtSign(original.user_uuid),
                hasPhone: true,
                hasPassword: await this.hasPassword(original.user_uuid),
                rebind: status,
            };
        } else {
            this.logger.info("not found original user", {
                rebindPhone: { userUUID: original.user_uuid },
            });
            throw new FError(ErrorCode.UserNotFound);
        }
    }

    private static async canSend(safePhone: string): Promise<boolean> {
        const ttl = await RedisService.ttl(RedisKey.phoneBinding(safePhone));

        if (ttl < 0) {
            return true;
        }

        const elapsedTime = MessageExpirationSecond - ttl;

        return elapsedTime > MessageIntervalSecond;
    }

    private async hasPassword(userUUID: string): Promise<boolean> {
        const user = await userDAO.findOne(this.DBTransaction, ["user_password"], {
            user_uuid: userUUID,
        });
        return Boolean(user?.user_password);
    }

    private async tryUpdate(
        dao: DAO<UserPlatform>,
        user_uuid: string,
        status: RebindStatus,
        platform: LoginPlatform,
    ) {
        const [original, current] = await Promise.all([
            this.exists(dao, user_uuid),
            this.exists(dao, this.userUUID),
        ]);
        const key = platform.toLowerCase() as RebindStatusKey;

        // Do not update the existing value
        if (original && current) {
            status[key] = RebindStatusVal.Failed;
        }

        // Move to original user
        else if (current) {
            await dao.update(
                this.DBTransaction,
                { user_uuid: user_uuid },
                { user_uuid: this.userUUID },
            );
            status[key] = RebindStatusVal.Success;

            // Record sensitive data, currently only WeChat is affected
            if (platform === LoginPlatform.WeChat) {
                await userSensitiveDAO.update(
                    this.DBTransaction,
                    { user_uuid: user_uuid },
                    { user_uuid: this.userUUID },
                );
            }
        }
    }

    private async exists(dao: DAO<UserPlatform>, user_uuid: string): Promise<boolean> {
        const result = await dao.findOne(this.DBTransaction, ["id"], { user_uuid });
        return result !== null;
    }

    private static async assertCodeCorrect(safePhone: string, code: number): Promise<void> {
        const value = await RedisService.get(RedisKey.phoneBinding(safePhone));

        if (String(code) !== value) {
            throw new FError(ErrorCode.SMSVerificationCodeInvalid);
        }
    }

    private static readonly ExhaustiveAttackCount = 10;

    private static async notExhaustiveAttack(safePhone: string): Promise<void> {
        const key = RedisKey.phoneTryBindingCount(safePhone);
        const value = Number(await RedisService.get(key)) || 0;

        if (value > UserRebindPhoneService.ExhaustiveAttackCount) {
            throw new FError(ErrorCode.ExhaustiveAttack);
        }

        const count = await RedisService.incr(key);

        if (count === 1) {
            // must re-wait 10 minutes
            await RedisService.expire(key, 60 * 10);
        }
    }

    private static async clearTryBindingCount(safePhone: string): Promise<void> {
        await RedisService.del(RedisKey.phoneTryBindingCount(safePhone));
    }

    private static async clearVerificationCode(safePhone: string): Promise<void> {
        await RedisService.del(RedisKey.phoneBinding(safePhone));
    }
}

export type UserRebindReturn = {
    name: string;
    avatar: string;
    token: string;
    userUUID: string;
    hasPhone: boolean;
    hasPassword: boolean;
    rebind: RebindStatus;
};
