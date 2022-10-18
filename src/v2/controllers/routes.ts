import { cloudStorageRouters } from "./cloud-storage/routes";
import { userRouters } from "./user/routes";
import { developerOAuthRouters } from "./developer/routes";
import { applicationRouters } from "./application/routes";
import { oauthRouters } from "./auth2/routes";

export const v2Routes = [
    userRouters,
    cloudStorageRouters,
    developerOAuthRouters,
    applicationRouters,
    oauthRouters,
];
