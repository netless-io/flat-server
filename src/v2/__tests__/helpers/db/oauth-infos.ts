import { DeveloperOAuthScope, OAuthInfosModel } from "../../../../model/oauth/oauth-infos";
import { v4 } from "uuid";
import { EntityManager } from "typeorm";

export class CreateOAuthInfos {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: {
        oauthUUID: string;
        appName: string;
        appDesc: string;
        ownerUUID: string;
        scopes: string;
        homepageURL: string;
        logoURL: string;
        callbacksURL: string;
        clientID: string;
    }) {
        const hasOAuthUUID = await this.t.findOne(OAuthInfosModel, {
            where: {
                oauth_uuid: info.oauthUUID,
            },
        });

        if (!hasOAuthUUID) {
            await this.t.insert(OAuthInfosModel, {
                oauth_uuid: info.oauthUUID,
                app_name: info.appName,
                app_desc: info.appDesc,
                owner_uuid: info.ownerUUID,
                scopes: info.scopes,
                homepage_url: info.homepageURL,
                callbacks_url: info.callbacksURL,
                logo_url: info.logoURL,
                client_id: info.clientID,
            });
        }

        return {
            ...info,
            scopes: info.scopes.split(" "),
            callbacksURL: info.callbacksURL.split(" "),
        };
    }

    public async quick(info?: {
        oauthUUID?: string;
        appName?: string;
        appDesc?: string;
        ownerUUID?: string;
        scopes?: string;
        homepageURL?: string;
        logoURL?: string;
        callbacksURL?: string;
        clientID?: string;
    }) {
        const result = await this.full({
            oauthUUID: info?.oauthUUID || v4(),
            appName: info?.appName || v4().slice(0, 30),
            appDesc: info?.appDesc || v4(),
            ownerUUID: info?.ownerUUID || v4(),
            scopes:
                info?.scopes ||
                `${DeveloperOAuthScope.UserNameRead} ${DeveloperOAuthScope.UserUUIDRead}`,
            homepageURL: info?.homepageURL || `https://${v4()}.com`,
            logoURL: info?.logoURL || `https://${v4()}.com/logo.png`,
            callbacksURL:
                info?.callbacksURL || `https://${v4()}.com/callback https://${v4()}.com/callback`,
            clientID: info?.clientID || v4(),
        });

        return result;
    }
}
