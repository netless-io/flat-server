import { Server } from "../../../utils/registryRoutersV2";
import { cloudStorageList, cloudStorageListSchema } from "./list";

export const cloudStorageRouters = (server: Server): void => {
    server.post("cloud-storage/list", cloudStorageList, {
        schema: cloudStorageListSchema,
    });
};
