import { Server } from "../../../utils/registryRoutersV2";
import { developerOAuthCreate, DeveloperOAuthCreateSchema } from "./oauth/create";
import {
    developerOAuthSettingDetail,
    DeveloperOAuthSettingDetailSchema,
} from "./oauth/setting-detail";
import {
    developerOAuthCreateSecret,
    DeveloperOAuthCreateSecretSchema,
} from "./oauth/create-secret";
import {
    developerOAuthDeleteSecret,
    DeveloperOAuthDeleteSecretSchema,
} from "./oauth/delete-secret";
import { developerOAuthDelete, DeveloperOAuthDeleteSchema } from "./oauth/delete";
import {
    developerOAuthLogoUploadFinish,
    DeveloperOAuthLogoUploadFinishSchema,
    developerOAuthLogoUploadStart,
    DeveloperOAuthLogoUploadStartSchema,
} from "./oauth/oauth-logo";
import { developerOAuthList, DeveloperOAuthListSchema } from "./oauth/list";

export const developerOAuthRouters = (server: Server): void => {
    server.post("developer/oauth/list", developerOAuthList, {
        schema: DeveloperOAuthListSchema,
    });

    server.post("developer/oauth/create", developerOAuthCreate, {
        schema: DeveloperOAuthCreateSchema,
    });

    server.post("developer/oauth/delete", developerOAuthDelete, {
        schema: DeveloperOAuthDeleteSchema,
    });

    server.post("developer/oauth/setting/detail", developerOAuthSettingDetail, {
        schema: DeveloperOAuthSettingDetailSchema,
    });

    server.post("developer/oauth/secret/create", developerOAuthCreateSecret, {
        schema: DeveloperOAuthCreateSecretSchema,
    });

    server.post("developer/oauth/secret/delete", developerOAuthDeleteSecret, {
        schema: DeveloperOAuthDeleteSecretSchema,
    });

    server.post("developer/oauth/logo/upload/start", developerOAuthLogoUploadStart, {
        schema: DeveloperOAuthLogoUploadStartSchema,
    });

    server.post("developer/oauth/logo/upload/finish", developerOAuthLogoUploadFinish, {
        schema: DeveloperOAuthLogoUploadFinishSchema,
    });
};
