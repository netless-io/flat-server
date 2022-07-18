import { Server } from "../../../utils/registryRoutersV2";
import { cloudStorageList, cloudStorageListSchema } from "./list";
import { cloudStorageDirectoryCreate, cloudStorageDirectoryCreateSchema } from "./directory/create";

export const cloudStorageRouters = (server: Server): void => {
    server.post("cloud-storage/list", cloudStorageList, {
        schema: cloudStorageListSchema,
    });

    server.post("cloud-storage/directory/create", cloudStorageDirectoryCreate, {
        schema: cloudStorageDirectoryCreateSchema,
    });
};