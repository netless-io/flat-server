import { createLoggerService } from "../../../../logger";
import { EntityManager } from "typeorm";
import { customAlphabet } from "nanoid/async";
import { oauthInfosDAO } from "../../../dao";
import { DeveloperOAuthScope, OAuthInfosModel } from "../../../../model/oauth/oauth-infos";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import {
    DeveloperOAuthInfoDetailByDB,
    DeveloperOAuthInfoDetailReturn,
    DeveloperOAuthInfoCreateConfig,
    DeveloperOAuthInfoInfoReturn,
    DeveloperOAuthInfoUpdateConfig,
} from "./oauth-info.type";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { UserModel } from "../../../../model/user/User";
import _ from "lodash";
import { OAuthUsersModel } from "../../../../model/oauth/oauth-users";

export class DeveloperOAuthInfoService {
    private readonly logger = createLoggerService<"developerOAuthInfo">({
        serviceName: "developerOAuthInfo",
        ids: this.ids,
    });

    private static clientIDNanoID = customAlphabet("123456789abcdefghjklmnprstuvwxyz", 20);

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async create(config: DeveloperOAuthInfoCreateConfig): Promise<void> {
        const clientID = await DeveloperOAuthInfoService.clientIDNanoID();

        const scopes = _.uniq(config.scopes).join(" ");
        const callbacksURL = config.callbacksURL.join(" ");

        this.logger.debug("create oauth info params", {
            developerOAuthInfo: {
                appName: config.appName,
                appDesc: config.appDesc,
                homepageURL: config.homepageURL,
                scopes,
                callbacksURL,
            },
        });

        await oauthInfosDAO.insert(this.DBTransaction, {
            app_name: config.appName,
            app_desc: config.appDesc,
            homepage_url: config.homepageURL,
            client_id: clientID,
            oauth_uuid: config.oauthUUID,
            owner_uuid: this.userUUID,
            // TODO: Support multiple region urls @BlackHole1
            logo_url:
                "https://flat-storage.oss-cn-hangzhou.aliyuncs.com/flat-resources/oauth/default-logo.png",
            scopes,
            callbacks_url: callbacksURL,
        });
    }

    public async delete(oauthUUID: string): Promise<void> {
        this.logger.debug("delete oauth info", {
            developerOAuthInfo: {
                oauthUUID,
            },
        });

        await oauthInfosDAO.delete(this.DBTransaction, {
            oauth_uuid: oauthUUID,
        });
    }

    public async update(config: DeveloperOAuthInfoUpdateConfig): Promise<void> {
        const updateData: QueryDeepPartialEntity<OAuthInfosModel> = {};
        if (config.appName) {
            updateData.app_name = config.appName;
        }
        if (config.appDesc) {
            updateData.app_desc = config.appDesc;
        }
        if (config.homepageURL) {
            updateData.homepage_url = config.homepageURL;
        }
        if (config.scopes) {
            updateData.scopes = config.scopes.join(" ");
        }
        if (config.callbacksURL) {
            updateData.callbacks_url = config.callbacksURL.join(" ");
        }

        if (Object.keys(updateData).length === 0) {
            this.logger.info("no update data");
            return;
        }

        this.logger.debug("update oauth info", {
            developerOAuthInfo: {
                ...config,
                scopes: config.scopes?.join(" "),
                callbacksURL: config.callbacksURL?.join(" "),
            },
        });

        await oauthInfosDAO.update(this.DBTransaction, updateData, {
            oauth_uuid: config.oauthUUID,
        });
    }

    public async info(oauthUUID: string): Promise<DeveloperOAuthInfoInfoReturn> {
        const oauthInfo = await oauthInfosDAO.findOne(
            this.DBTransaction,
            [
                "app_name",
                "app_desc",
                "homepage_url",
                "client_id",
                "logo_url",
                "scopes",
                "callbacks_url",
            ],
            {
                oauth_uuid: oauthUUID,
            },
        );

        if (!oauthInfo) {
            this.logger.info("oauth uuid not found", {
                developerOAuthInfo: {
                    oauthUUID: oauthUUID,
                },
            });

            throw new FError(ErrorCode.OAuthUUIDNotFound);
        }

        return {
            appName: oauthInfo.app_name,
            appDesc: oauthInfo.app_desc,
            homepageURL: oauthInfo.homepage_url,
            clientID: oauthInfo.client_id,
            logoURL: oauthInfo.logo_url,
            scopes: oauthInfo.scopes.split(" ") as DeveloperOAuthScope[],
            callbacksURL: oauthInfo.callbacks_url.split(" "),
        };
    }

    public async detail(oauthUUID: string): Promise<DeveloperOAuthInfoDetailReturn> {
        const oauthInfo = await this.DBTransaction.createQueryBuilder(OAuthInfosModel, "oi")
            .innerJoin(UserModel, "u", "u.user_uuid = oi.owner_uuid")
            .innerJoin(OAuthUsersModel, "ou", "ou.oauth_uuid = oi.oauth_uuid")
            .addSelect("u.user_name", "ownerName")
            .addSelect("oi.app_name", "appName")
            .addSelect("oi.app_desc", "appDesc")
            .addSelect("oi.homepage_url", "homepageURL")
            .addSelect("oi.logo_url", "logoURL")
            .addSelect("ou.scopes", "scopes")
            .andWhere("ou.user_uuid = :userUUID", { userUUID: this.userUUID })
            .andWhere("oi.oauth_uuid = :oauthUUID", { oauthUUID })
            .andWhere("oi.is_delete = false")
            .andWhere("u.is_delete = false")
            .andWhere("ou.is_delete = false")
            .getRawOne<DeveloperOAuthInfoDetailByDB>();

        if (!oauthInfo) {
            this.logger.info("oauth uuid not found, maybe owner already delete account", {
                developerOAuthInfo: {
                    oauthUUID: oauthUUID,
                },
            });

            throw new FError(ErrorCode.OAuthUUIDNotFound);
        }

        return {
            ownerName: oauthInfo.ownerName,
            appName: oauthInfo.appName,
            appDesc: oauthInfo.appDesc,
            homepageURL: oauthInfo.homepageURL,
            logoURL: oauthInfo.logoURL,
            scopes: oauthInfo.scopes.split(" ") as DeveloperOAuthScope[],
        };
    }

    public async getLogoURL(oauthUUID: string): Promise<string> {
        const result = await oauthInfosDAO.findOne(this.DBTransaction, "logo_url", {
            oauth_uuid: oauthUUID,
        });

        if (!result.logo_url) {
            throw new FError(ErrorCode.OAuthUUIDNotFound);
        }

        return result.logo_url;
    }

    public async updateLogoURL(oauthUUID: string, url: string): Promise<void> {
        await oauthInfosDAO.update(
            this.DBTransaction,
            {
                logo_url: url,
            },
            {
                oauth_uuid: oauthUUID,
            },
        );
    }

    public async findClientID(oauthUUID: string): Promise<string> {
        const { client_id: clientID } = await oauthInfosDAO.findOne(
            this.DBTransaction,
            "client_id",
            {
                oauth_uuid: oauthUUID,
            },
        );

        if (!clientID) {
            this.logger.info("oauth uuid not found", {
                developerOAuthInfo: {
                    oauthUUID: oauthUUID,
                },
            });

            throw new FError(ErrorCode.OAuthClientIDNotFound);
        }

        return clientID;
    }

    public async assertIsOwner(oauthUUID: string): Promise<void> {
        const oauthInfo = await oauthInfosDAO.findOne(this.DBTransaction, ["id"], {
            oauth_uuid: oauthUUID,
            owner_uuid: this.userUUID,
        });

        if (!oauthInfo) {
            this.logger.info("current user not is oauth app owner", {
                developerOAuthInfo: {
                    oauthUUID: oauthUUID,
                    userUUID: this.userUUID,
                },
            });

            throw new FError(ErrorCode.OAuthUUIDNotFound);
        }
    }
}
