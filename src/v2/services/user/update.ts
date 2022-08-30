import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";
import { userDAO } from "../../dao";

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
        this.logger.debug("avatar URL updated", {
            userUpdate: {
                newAvatarURL,
            },
        });
    }
}
