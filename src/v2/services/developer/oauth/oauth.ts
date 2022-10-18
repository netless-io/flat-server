import { createLoggerService } from "../../../../logger";
import { EntityManager } from "typeorm";
import { DeveloperOAuthInfoService } from "./oauth-info";
import {
    DeveloperOAuthCreateConfig,
    DeveloperOAuthInfoReturn,
    DeveloperOAuthListByUserConfig,
    DeveloperOAuthListByUserReturn,
    DeveloperOAuthListConfig,
    DeveloperOAuthListReturn,
} from "./oauth.type";
import { v4 } from "uuid";
import { DeveloperOAuthSecretService } from "./oauth-secret";
import { DeveloperOAuthUserService } from "./oauth-user";
import { oauthInfosDAO } from "../../../dao";
import { OAuthInfosModel } from "../../../../model/oauth/oauth-infos";
import { OAuthUsersModel } from "../../../../model/oauth/oauth-users";
import { UserModel } from "../../../../model/user/User";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";

export class DeveloperOAuthService {
    // @ts-ignore
    private readonly _logger = createLoggerService<"developerOAuth">({
        serviceName: "developerOAuth",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async create(config: DeveloperOAuthCreateConfig): Promise<string> {
        const oauthInfoSVC = new DeveloperOAuthInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const oauthUUID = v4();

        await oauthInfoSVC.create({
            oauthUUID,
            appName: config.appName,
            appDesc: config.appDesc,
            homepageURL: config.homepageURL,
            scopes: config.scopes,
            callbacksURL: config.callbacksURL,
        });

        return oauthUUID;
    }

    public async list(config: DeveloperOAuthListConfig): Promise<DeveloperOAuthListReturn> {
        const result = await oauthInfosDAO.find(
            this.DBTransaction,
            ["oauth_uuid", "app_name", "logo_url"],
            {
                owner_uuid: this.userUUID,
            },
            {
                order: ["created_at", "DESC"],
                limit: config.size,
                offset: (config.page - 1) * config.size,
            },
        );

        return result.map(item => {
            return {
                oauthUUID: item.oauth_uuid,
                appName: item.app_name,
                logoURL: item.logo_url,
            };
        });
    }

    public async listByUser(
        config: DeveloperOAuthListByUserConfig,
    ): Promise<DeveloperOAuthListByUserReturn> {
        const result = await this.DBTransaction.createQueryBuilder(OAuthInfosModel, "oi")
            .innerJoin(OAuthUsersModel, "ou", "oi.oauth_uuid = ou.oauth_uuid")
            .innerJoin(UserModel, "u", "oi.owner_uuid = u.user_uuid")
            .addSelect("u.user_name", "ownerName")
            .addSelect("oi.oauth_uuid", "oauthUUID")
            .addSelect("oi.app_name", "appName")
            .addSelect("oi.homepage_url", "homepageURL")
            .addSelect("oi.logo_url", "logoURL")
            .andWhere("ou.user_uuid = :userUUID", {
                userUUID: this.userUUID,
            })
            .andWhere("ou.is_delete = false")
            .andWhere("oi.is_delete = false")
            .andWhere("u.is_delete = false")
            .orderBy("ou.created_at", "DESC")
            .offset((config.page - 1) * 50)
            .limit(config.size)
            .getRawMany<DeveloperOAuthListByUserReturn[0]>();

        return result.map(item => {
            return {
                ownerName: item.ownerName,
                oauthUUID: item.oauthUUID,
                appName: item.appName,
                homepageURL: item.homepageURL,
                logoURL: item.logoURL,
            };
        });
    }

    public async info(oauthUUID: string): Promise<DeveloperOAuthInfoReturn> {
        const oauthInfosSVC = new DeveloperOAuthInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const oauthSecretSVC = new DeveloperOAuthSecretService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const oauthUserSVC = new DeveloperOAuthUserService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const oauthInfo = await oauthInfosSVC.info(oauthUUID);
        const userCount = await oauthUserSVC.countByOAuthUUID(oauthUUID);
        const oauthSecrets = await oauthSecretSVC.info(oauthUUID);

        return {
            ...oauthInfo,
            userCount,
            secrets: oauthSecrets,
        };
    }

    public async delete(oauthUUID: string): Promise<void> {
        const oauthInfosSVC = new DeveloperOAuthInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const oauthSecretSVC = new DeveloperOAuthSecretService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const oauthUserSVC = new DeveloperOAuthUserService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const clientID = await oauthInfosSVC.findClientID(oauthUUID);
        await RedisService.delByPattern(RedisKey.oauthAuthorizeTokenByUserUUID(clientID, "*"));

        await Promise.all([
            oauthInfosSVC.delete(oauthUUID),
            oauthSecretSVC.deleteAll(oauthUUID),
            oauthUserSVC.deleteByOAuthUUID(oauthUUID),
        ]);
    }
}
