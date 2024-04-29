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
import { developerOAuthUpdate, DeveloperOAuthUpdateSchema } from "./oauth/update";
import { developerPartnerRegister, developerPartnerRegisterSchema } from "./partner/register";
import {
    developerPartnerRemoveRoom,
    developerPartnerRemoveRoomSchema,
} from "./partner/remove-room";
import {
    developerPartnerCreateRoom,
    developerPartnerCreateRoomSchema,
} from "./partner/create-room";
import { developerPartnerListRooms, developerPartnerListRoomsSchema } from "./partner/list-rooms";

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

    server.post("developer/oauth/update", developerOAuthUpdate, {
        schema: DeveloperOAuthUpdateSchema,
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

    server.post("developer/partner/register", developerPartnerRegister, {
        schema: developerPartnerRegisterSchema,
        auth: false,
    });

    server.post("developer/partner/create-room", developerPartnerCreateRoom, {
        schema: developerPartnerCreateRoomSchema,
        auth: false,
    });

    server.post("developer/partner/list-rooms", developerPartnerListRooms, {
        schema: developerPartnerListRoomsSchema,
        auth: false,
    });

    server.post("developer/partner/remove-room", developerPartnerRemoveRoom, {
        schema: developerPartnerRemoveRoomSchema,
        auth: false,
    });
};
