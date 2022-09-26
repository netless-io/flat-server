import { DeveloperOAuthScope } from "../../../../model/oauth/oauth-infos";
import { v4 } from "uuid";
import { EntityManager } from "typeorm";
import { OAuthUsersModel } from "../../../../model/oauth/oauth-users";

export class CreateUsersInfos {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: { oauthUUID: string; scopes: string; userUUID: string }) {
        const hasUser = await this.t.findOne(OAuthUsersModel, {
            where: {
                oauth_uuid: info.oauthUUID,
                user_uuid: info.userUUID,
            },
        });

        if (!hasUser) {
            await this.t.insert(OAuthUsersModel, {
                oauth_uuid: info.oauthUUID,
                scopes: info.scopes,
                user_uuid: info.userUUID,
            });
        }

        return {
            ...info,
            scopes: info.scopes.split(" "),
        };
    }

    public async quick(info?: { oauthUUID?: string; userUUID?: string; scopes?: string }) {
        const result = await this.full({
            oauthUUID: info?.oauthUUID || v4(),
            userUUID: info?.userUUID || v4(),
            scopes:
                info?.scopes ||
                `${DeveloperOAuthScope.UserNameRead} ${DeveloperOAuthScope.UserUUIDRead}`,
        });

        return result;
    }
}
