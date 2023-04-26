import { EntityManager } from "typeorm";
import { UserSensitiveModel } from "../../../model/user/Sensitive";
import { createLoggerService } from "../../../logger";

export class UserSensitiveService {
    private readonly logger = createLoggerService<"userSensitive">({
        serviceName: "userSensitive",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async list(range: { from: Date; to: Date }): Promise<UserSensitiveListReturn[]> {
        this.logger.debug("list user sensitive", {
            userSensitive: {
                from: range.from.valueOf(),
                to: range.to.valueOf(),
            },
        });

        const result: UserSensitiveListReturn[] = await this.DBTransaction.createQueryBuilder(
            UserSensitiveModel,
            "us",
        )
            .addSelect("us.type", "type")
            .addSelect("us.content", "content")
            .where("us.user_uuid = :userUUID", { userUUID: this.userUUID })
            .andWhere("us.created_at >= :from", { from: range.from })
            .andWhere("us.created_at <= :to", { to: range.to })
            .andWhere("us.is_delete = :isDelete", { isDelete: false })
            .getRawMany();

        this.logger.debug("list user sensitive done", {
            userSensitive: {
                from: range.from.valueOf(),
                to: range.to.valueOf(),
                count: result.length,
            },
        });

        return result.map(({ type, content }) => ({ type, content }));
    }
}

export type UserSensitiveListReturn = {
    type: string;
    content: string;
};
