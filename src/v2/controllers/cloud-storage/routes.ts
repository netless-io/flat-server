import { Server } from "../../../utils/registryRoutersV2";
import { cloudStorageList, cloudStorageListSchema } from "./list";
import { cloudStorageDirectoryCreate, cloudStorageDirectoryCreateSchema } from "./create-directory";
import { cloudStorageRename, cloudStorageRenameSchema } from "./rename";
import { cloudStorageMove, cloudStorageMoveSchema } from "./move";

export const cloudStorageRouters = (server: Server): void => {
    server.post("cloud-storage/list", cloudStorageList, {
        schema: cloudStorageListSchema,
    });

    server.post("cloud-storage/create-directory", cloudStorageDirectoryCreate, {
        schema: cloudStorageDirectoryCreateSchema,
    });

    server.post("cloud-storage/rename", cloudStorageRename, {
        schema: cloudStorageRenameSchema,
    });

    server.post("cloud-storage/move", cloudStorageMove, {
        schema: cloudStorageMoveSchema,
    });
};
