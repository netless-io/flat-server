import { createLoggerService } from "../../../../logger";
import { EntityManager } from "typeorm";
import { oauthUsersDAO } from "../../../dao";
import { OAuthInfosModel } from "../../../../model/oauth/oauth-infos";
import { OAuthUsersModel } from "../../../../model/oauth/oauth-users";
import {
    DeveloperOAuthUserGrantConfig,
    DeveloperOAuthUserInfoConfig,
    DeveloperOAuthUserInfoReturn,
    DeveloperOAuthUserInfoSQL,
} from "./oauth-user.type";
import { UserModel } from "../../../../model/user/User";

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

    public async info(config: DeveloperOAuthUserInfoConfig): Promise<DeveloperOAuthUserInfoReturn> {
        const result = await this.DBTransaction.createQueryBuilder(OAuthUsersModel, "ou")
            .innerJoin(OAuthInfosModel, "oi", "ou.oauth_uuid = oi.oauth_uuid")
            .innerJoin(UserModel, "u", "oi.owner_uuid = u.user_uuid")
            .addSelect("oi.oauth_uuid", "oauthUUID")
            .addSelect("oi.app_name", "appName")
            .addSelect("oi.logo_url", "logoURL")
            .addSelect("oi.homepage_url", "homepageURL")
            .addSelect("u.user_name", "ownerName")
            .andWhere("ou.user_uuid = :userUUID", { userUUID: this.userUUID })
            .andWhere("ou.is_delete = false")
            .andWhere("oi.is_delete = false")
            .andWhere("u.is_delete = false")
            .orderBy("ou.created_at", "DESC")
            .offset((config.page - 1) * config.size)
            .limit(config.size)
            .getRawMany<DeveloperOAuthUserInfoSQL>();

        return result.map(item => {
            return {
                ownerName: item.ownerName,
                oauthUUID: item.oauthUUID,
                appName: item.appName,
                logoURL: item.logoURL,
                homepageURL: item.homepageURL,
            };
        });
    }

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
        if (await this.hasGrant(config.oauthUUID)) {
            return;
        }

        const scopes = config.scopes.join(" ");

        this.logger.debug("grant oauth", {
            developerOAuthUser: {
                oauthUUID: config.oauthUUID,
                scopes,
            },
        });

        await oauthUsersDAO.insert(this.DBTransaction, {
            oauth_uuid: config.oauthUUID,
            user_uuid: this.userUUID,
            scopes,
        });
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
}
