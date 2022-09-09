import { cloudStorageRouters } from "./cloud-storage/routes";
import { userRouters } from "./user/routes";

export const v2Routes = [userRouters, cloudStorageRouters];
