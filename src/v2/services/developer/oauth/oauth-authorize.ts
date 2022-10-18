import { createLoggerService } from "../../../../logger";
import { customAlphabet } from "nanoid/async";
import { EntityManager } from "typeorm";
import { DeveloperOAuthScope, OAuthInfosModel } from "../../../../model/oauth/oauth-infos";
import { UserModel } from "../../../../model/user/User";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { errPairSync } from "./internal/utils/err-pair";
import {
    DeveloperOAuthAuthorizeAuthorizeConfig,
    DeveloperOAuthAuthorizeAuthorizeInfoByClientIDReturn,
    DeveloperOAuthAuthorizeAuthorizeReturn,
    DeveloperOAuthUserInfoSQL,
    GenerateOAuthTokenReturn,
} from "./oauth-authorize.type";
import { DeveloperOAuthUserService } from "./oauth-user";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";

export class DeveloperOAuthAuthorizeService {
    private readonly logger = createLoggerService<"developerOAuthAuthorize">({
        serviceName: "developerOAuthAuthorize",
        ids: this.ids,
    });

    private static nanoID = customAlphabet("123456789abcdefghjklmnprstuvwxyz", 22);

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async view(
        config: DeveloperOAuthAuthorizeAuthorizeConfig,
    ): Promise<DeveloperOAuthAuthorizeAuthorizeReturn> {
        const [err, oauthInfo] = await errPairSync(this.infoByClientID(config.clientID));
        if (err) {
            return {
                status: "error",
                error: "invalid_request",
                errorDescription: "clientID not found",
            };
        }

        const callbackURL = oauthInfo.callbacksURL.find(item =>
            config.redirectURI.startsWith(item),
        );

        if (!callbackURL) {
            this.logger.info("redirectURI url not match");
            return {
                status: "error",
                error: "invalid_request",
                errorDescription: "redirectURI not found",
            };
        }

        {
            const result = config.scopes.every(scope => {
                return oauthInfo.scopes.includes(scope);
            });

            if (!result) {
                this.logger.info("scopes not match", {
                    developerOAuthAuthorize: {
                        scopes: config.scopes.join(" "),
                    },
                });
                return {
                    status: "error",
                    error: "invalid_scope",
                    errorDescription: "scopes not match",
                };
            }
        }

        const developerOAuthUserSVC = new DeveloperOAuthUserService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        const csrfToken = await DeveloperOAuthAuthorizeService.nanoID();
        await this.generateAuthorizeCSRFToken(oauthInfo.oauthUUID, csrfToken);

        if (await developerOAuthUserSVC.hasGrant(oauthInfo.oauthUUID)) {
            const userScopes = await developerOAuthUserSVC.getScopes(oauthInfo.oauthUUID);
            const isSameScopes = config.scopes.every(scope => {
                return userScopes.includes(scope);
            });

            if (isSameScopes) {
                return {
                    status: "hasGrant",
                    data: {
                        oauthUUID: oauthInfo.oauthUUID,
                        csrfToken,
                    },
                };
            }
        }

        return {
            status: "success",
            data: {
                ...oauthInfo,
                callbackURL,
                csrfToken,
            },
        };
    }

    public async infoByClientID(
        clientID: string,
    ): Promise<DeveloperOAuthAuthorizeAuthorizeInfoByClientIDReturn> {
        const result = await this.DBTransaction.createQueryBuilder(OAuthInfosModel, "oi")
            .innerJoin(UserModel, "u", "oi.owner_uuid = u.user_uuid")
            .addSelect("oi.oauth_uuid", "oauthUUID")
            .addSelect("oi.app_name", "appName")
            .addSelect("oi.logo_url", "logoURL")
            .addSelect("oi.homepage_url", "homepageURL")
            .addSelect("oi.scopes", "scopes")
            .addSelect("oi.callbacks_url", "callbacksURL")
            .addSelect("u.user_name", "ownerName")
            .addSelect("u.avatar_url", "ownerAvatarURL")
            .andWhere("oi.client_id = :clientID", { clientID: clientID })
            .andWhere("oi.is_delete = false")
            .andWhere("u.is_delete = false")
            .getRawOne<DeveloperOAuthUserInfoSQL>();

        if (!result) {
            throw new FError(ErrorCode.OAuthClientIDNotFound);
        }

        return {
            ownerName: result.ownerName,
            ownerAvatarURL: result.ownerAvatarURL,
            scopes: result.scopes.split(" ") as DeveloperOAuthScope[],
            oauthUUID: result.oauthUUID,
            appName: result.appName,
            logoURL: result.logoURL,
            homepageURL: result.homepageURL,
            callbacksURL: result.callbacksURL.split(" "),
        };
    }

    public async generateAuthorizeCode(userUUID: string): Promise<string> {
        const code = await DeveloperOAuthAuthorizeService.nanoID();
        await RedisService.set(RedisKey.oauthAuthorizeCode(code), userUUID, 60 * 10);

        return code;
    }

    public static async getAuthorizeCodePayload(code: string): Promise<string> {
        const result = await RedisService.get(RedisKey.oauthAuthorizeCode(code));

        if (!result) {
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        return result;
    }

    public async recycleAuthorizeCode(code: string): Promise<void> {
        await RedisService.del(RedisKey.oauthAuthorizeCode(code));
    }

    public async generateAuthorizeCSRFToken(oauthUUID: string, token?: string): Promise<string> {
        const csrfToken = token || (await DeveloperOAuthAuthorizeService.nanoID());

        await RedisService.set(
            RedisKey.oauthAuthorizeCSRFToken(oauthUUID, this.userUUID),
            csrfToken,
            60 * 10,
        );

        return csrfToken;
    }

    public async getAuthorizeCSRFToken(oauthUUID: string): Promise<string | null> {
        const csrfToken = await RedisService.get(
            RedisKey.oauthAuthorizeCSRFToken(oauthUUID, this.userUUID),
        );

        return csrfToken;
    }

    public async recycleAuthorizeCSRFToken(oauthUUID: string): Promise<void> {
        await RedisService.del(RedisKey.oauthAuthorizeCSRFToken(oauthUUID, this.userUUID));
    }

    public async saveOAuthAuthorizeScopes(
        oauthUUID: string,
        scopes: DeveloperOAuthScope[],
    ): Promise<void> {
        await RedisService.set(
            RedisKey.oauthAuthorizeScopes(oauthUUID, this.userUUID),
            JSON.stringify(scopes),
            60 * 10,
        );
    }

    public async getOAuthAuthorizeScopes(oauthUUID: string): Promise<DeveloperOAuthScope[]> {
        const scopes = await RedisService.get(
            RedisKey.oauthAuthorizeScopes(oauthUUID, this.userUUID),
        );
        if (!scopes) {
            this.logger.info("scopes not found in redis", {
                developerOAuthAuthorize: {
                    oauthUUID,
                    userUUID: this.userUUID,
                },
            });
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        return JSON.parse(scopes) as DeveloperOAuthScope[];
    }

    public async generateOAuthToken(clientID: string): Promise<GenerateOAuthTokenReturn> {
        const [accessToken, refreshToken] = await Promise.all(
            Array.from({ length: 2 }, () => DeveloperOAuthAuthorizeService.nanoID()),
        );

        await RedisService.hmset(
            RedisKey.oauthAuthorizeAccessToken(accessToken),
            {
                clientID,
                refreshToken,
                userUUID: this.userUUID,
            },
            60 * 60 * 24 * 10,
        );

        await RedisService.hmset(RedisKey.oauthAuthorizeRefreshToken(refreshToken), {
            accessToken,
            userUUID: this.userUUID,
        });

        return {
            accessToken,
            refreshToken,
        };
    }
}
