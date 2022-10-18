import { createLoggerService } from "../../../../logger";
import { EntityManager } from "typeorm";
import { oauthUsersDAO } from "../../../dao";
import { DeveloperOAuthUserGrantConfig } from "./oauth-user.type";
import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

export class DeveloperOAuthUserService {
    private readonly logger = createLoggerService<"developerOAuthUser">({
        serviceName: "developerOAuthUser",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async countByOAuthUUID(oauthUUID: string): Promise<number> {
        return oauthUsersDAO.count(this.DBTransaction, {
            oauth_uuid: oauthUUID,
        });
    }

    public async countByUserUUID(): Promise<number> {
        return oauthUsersDAO.count(this.DBTransaction, {
            user_uuid: this.userUUID,
        });
    }

    public async deleteByOAuthUUID(oauthUUID: string): Promise<void> {
        this.logger.debug("delete all oauth user", {
            developerOAuthUser: {
                oauthUUID,
            },
        });
        await oauthUsersDAO.delete(this.DBTransaction, {
            oauth_uuid: oauthUUID,
        });
    }

    public async grant(config: DeveloperOAuthUserGrantConfig): Promise<void> {
        const scopes = config.scopes.join(" ");

        this.logger.debug("grant oauth", {
            developerOAuthUser: {
                oauthUUID: config.oauthUUID,
                scopes,
            },
        });

        await oauthUsersDAO.insert(
            this.DBTransaction,
            {
                oauth_uuid: config.oauthUUID,
                user_uuid: this.userUUID,
                scopes,
                is_delete: false,
            },
            {
                orUpdate: ["scopes", "is_delete"],
            },
        );
    }

    public async revoke(oauthUUID: string): Promise<void> {
        this.logger.debug("revoke oauth", {
            developerOAuthUser: {
                oauthUUID,
                userUUID: this.userUUID,
            },
        });
        await oauthUsersDAO.delete(this.DBTransaction, {
            oauth_uuid: oauthUUID,
            user_uuid: this.userUUID,
        });
    }

    public async hasGrant(oauthUUID: string): Promise<boolean> {
        const result = await oauthUsersDAO.findOne(this.DBTransaction, ["id"], {
            oauth_uuid: oauthUUID,
            user_uuid: this.userUUID,
        });

        if (result) {
            this.logger.debug("has grant", {
                developerOAuthUser: {
                    oauthUUID,
                    userUUID: this.userUUID,
                },
            });
        }

        return !!result;
    }

    public async getScopes(oauthUUID: string): Promise<DeveloperOAuthScope[]> {
        const result = await oauthUsersDAO.findOne(this.DBTransaction, ["scopes"], {
            oauth_uuid: oauthUUID,
            user_uuid: this.userUUID,
        });

        if (!result) {
            throw new FError(ErrorCode.ParamsCheckFailed);
        }
        return result.scopes.split(" ") as DeveloperOAuthScope[];
    }
}
