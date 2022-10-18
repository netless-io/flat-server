import { createLoggerService } from "../../../../logger";
import { EntityManager } from "typeorm";
import {
    DeveloperOAuthSecretCreateReturn,
    DeveloperOAuthSecretInfoReturn,
} from "./oauth-secret.type";
import { customAlphabet } from "nanoid/async";
import { oauthSecretsDAO } from "../../../dao";
import { v4 } from "uuid";
import { DeveloperOAuthInfoService } from "./oauth-info";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

export class DeveloperOAuthSecretService {
    private readonly logger = createLoggerService<"developerOAuthSecret">({
        serviceName: "developerOAuthSecret",
        ids: this.ids,
    });

    private static clientSecretNanoID = customAlphabet("123456789abcdefghjklmnprstuvwxyz", 40);

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async create(oauthUUID: string): Promise<DeveloperOAuthSecretCreateReturn> {
        const clientSecret = await DeveloperOAuthSecretService.clientSecretNanoID();
        const secretUUID = v4();

        const clientID = await new DeveloperOAuthInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        ).findClientID(oauthUUID);

        this.logger.debug("create oauth secret params", {
            developerOAuthSecret: {
                oauthUUID,
                clientID,
            },
        });

        await oauthSecretsDAO.insert(this.DBTransaction, {
            oauth_uuid: oauthUUID,
            client_id: clientID,
            client_secret: clientSecret,
            secret_uuid: secretUUID,
        });

        return {
            secretUUID,
            clientSecret,
        };
    }

    public async info(oauthUUID: string): Promise<DeveloperOAuthSecretInfoReturn> {
        const result = await oauthSecretsDAO.find(
            this.DBTransaction,
            ["secret_uuid", "client_secret", "created_at"],
            {
                oauth_uuid: oauthUUID,
            },
            {
                order: ["created_at", "DESC"],
            },
        );

        return result.map(item => {
            return {
                secretUUID: item.secret_uuid,
                clientSecret: `******${item.client_secret.slice(-8)}`,
                createdAt: item.created_at.valueOf(),
            };
        });
    }

    public async delete(secretUUID: string): Promise<void> {
        this.logger.debug("delete oauth secret", {
            developerOAuthSecret: {
                secretUUID,
            },
        });

        await oauthSecretsDAO.delete(this.DBTransaction, {
            secret_uuid: secretUUID,
        });
    }

    public async deleteAll(oauthUUID: string): Promise<void> {
        this.logger.debug("delete all oauth secret", {
            developerOAuthSecret: {
                oauthUUID,
            },
        });

        await oauthSecretsDAO.delete(this.DBTransaction, {
            oauth_uuid: oauthUUID,
        });
    }

    public async assertIsOwner(secretUUID: string): Promise<void> {
        const { oauth_uuid: oauthUUID } = await oauthSecretsDAO.findOne(
            this.DBTransaction,
            "oauth_uuid",
            {
                secret_uuid: secretUUID,
            },
        );

        if (!oauthUUID) {
            throw new FError(ErrorCode.OAuthSecretUUIDNotFound);
        }

        await new DeveloperOAuthInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        ).assertIsOwner(oauthUUID);
    }

    public async assertExist(clientID: string, clientSecret: string): Promise<void> {
        const oauthSecret = await oauthSecretsDAO.findOne(this.DBTransaction, ["id"], {
            client_id: clientID,
            client_secret: clientSecret,
        });

        if (!oauthSecret) {
            throw new FError(ErrorCode.ParamsCheckFailed);
        }
    }
}
