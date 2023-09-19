import { createLoggerService } from "../../../logger";
import { EntityManager } from "typeorm";
import { userDAO } from "../../dao";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { BasicUserInfoReturn } from "./info.type";
import { generateAvatar } from "../../../utils/Avatar";

export class UserInfoService {
    private readonly logger = createLoggerService<"userInfo">({
        serviceName: "userInfo",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async basicInfo(): Promise<BasicUserInfoReturn> {
        const result = await userDAO.findOne(
            this.DBTransaction,
            ["user_name", "user_password", "avatar_url"],
            {
                user_uuid: this.userUUID,
            },
        );

        if (!result) {
            this.logger.info("user not found", {
                userInfo: {
                    userUUID: this.userUUID,
                },
            });

            throw new FError(ErrorCode.UserNotFound);
        }

        return {
            userName: result.user_name,
            userPassword: result.user_password,
            avatarURL: result.avatar_url || generateAvatar(this.userUUID),
        };
    }
}
