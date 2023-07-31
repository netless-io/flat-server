import { EntityManager } from "typeorm";
import { createLoggerService } from "../../../logger";
import { SensitiveType } from "../../../model/user/Constants";
import { userDAO, userSensitiveDAO } from "../../dao";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { hash } from "../../../utils/Hash";

export class UserUpdateService {
    private readonly logger = createLoggerService<"userUpdate">({
        serviceName: "userUpdate",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async userName(newUserName: string): Promise<void> {
        await userDAO.update(
            this.DBTransaction,
            {
                user_name: newUserName,
            },
            {
                user_uuid: this.userUUID,
            },
        );
        await userSensitiveDAO.insert(this.DBTransaction, {
            user_uuid: this.userUUID,
            type: SensitiveType.Name,
            content: newUserName,
        });
        this.logger.debug("user name updated", {
            userUpdate: {
                newUserName,
            },
        });
    }

    public async avatarURL(newAvatarURL: string): Promise<void> {
        await userDAO.update(
            this.DBTransaction,
            {
                avatar_url: newAvatarURL,
            },
            {
                user_uuid: this.userUUID,
            },
        );
        await userSensitiveDAO.insert(this.DBTransaction, {
            user_uuid: this.userUUID,
            type: SensitiveType.Avatar,
            content: newAvatarURL,
        });
        this.logger.debug("avatar URL updated", {
            userUpdate: {
                newAvatarURL,
            },
        });
    }

    public async password(oldPassword: string | null, newPassword: string): Promise<void> {
        newPassword = hash(newPassword);

        const user = await userDAO.findOne(this.DBTransaction, ["user_password"], {
            user_uuid: this.userUUID,
        });
        if (!user) {
            throw new FError(ErrorCode.UserNotFound);
        }

        if (user.user_password && (!oldPassword || hash(oldPassword) !== user.user_password)) {
            throw new FError(ErrorCode.UserPasswordIncorrect);
        }

        await userDAO.update(
            this.DBTransaction,
            { user_password: newPassword },
            { user_uuid: this.userUUID },
        );
    }
}
