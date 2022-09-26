import { v4 } from "uuid";
import { EntityManager } from "typeorm";
import { OAuthSecretsModel } from "../../../../model/oauth/oauth-secrets";

export class CreateSecretsInfos {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: {
        oauthUUID: string;
        clientID: string;
        clientSecret: string;
        secretUUID: string;
    }) {
        const hasUser = await this.t.findOne(OAuthSecretsModel, {
            where: {
                client_id: info.clientID,
                client_secret: info.clientSecret,
            },
        });

        if (!hasUser) {
            await this.t.insert(OAuthSecretsModel, {
                oauth_uuid: info.oauthUUID,
                client_id: info.clientID,
                client_secret: info.clientSecret,
                secret_uuid: info.secretUUID,
            });
        }

        return info;
    }

    public async quick(info?: {
        oauthUUID?: string;
        clientID?: string;
        clientSecret?: string;
        secretUUID?: string;
    }) {
        const result = await this.full({
            oauthUUID: info?.oauthUUID || v4(),
            clientID: info?.clientID || v4(),
            secretUUID: info?.secretUUID || v4(),
            clientSecret: info?.clientSecret || v4(),
        });

        return result;
    }
}
