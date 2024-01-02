import { cloudStorageRouters } from "./cloud-storage/routes";
import { userRouters } from "./user/routes";
import { developerOAuthRouters } from "./developer/routes";
import { applicationRouters } from "./application/routes";
import { roomRouters } from "./room/routes";
import { oauthRouters } from "./auth2/routes";
import { tempPhotoRouters } from "./temp-photo/routes";
import { regionConfigsRouters } from "./configs/region-configs";
import { registerRouters } from "./register/routes";
import { loginRouters } from "./login/routes";
import { resetRouters } from "./reset/routes";
import { adminRouters } from "./admin/routes";

export const v2Routes = [
    userRouters,
    cloudStorageRouters,
    developerOAuthRouters,
    applicationRouters,
    roomRouters,
    oauthRouters,
    tempPhotoRouters,
    regionConfigsRouters,
    registerRouters,
    loginRouters,
    resetRouters,
    adminRouters,
];
