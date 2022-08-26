import { Server } from "../../../utils/registryRoutersV2";
import { cloudStorageList, cloudStorageListSchema } from "./list";
import { cloudStorageDirectoryCreate, cloudStorageDirectoryCreateSchema } from "./create-directory";
import { cloudStorageRename, cloudStorageRenameSchema } from "./rename";
import { cloudStorageMove, cloudStorageMoveSchema } from "./move";
import { cloudStorageDelete, cloudStorageDeleteSchema } from "./delete";
import { cloudStorageUploadStart, cloudStorageUploadStartSchema } from "./upload/start";
import { cloudStorageUploadFinish, cloudStorageUploadFinishSchema } from "./upload/finish";
import { cloudStorageConvertStart, cloudStorageConvertStartSchema } from "./convert/start";
import { cloudStorageConvertFinish, cloudStorageConvertFinishSchema } from "./convert/finish";

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

    server.post("cloud-storage/delete", cloudStorageDelete, {
        schema: cloudStorageDeleteSchema,
    });

    server.post("cloud-storage/upload/start", cloudStorageUploadStart, {
        schema: cloudStorageUploadStartSchema,
    });

    server.post("cloud-storage/upload/finish", cloudStorageUploadFinish, {
        schema: cloudStorageUploadFinishSchema,
    });

    server.post("cloud-storage/convert/start", cloudStorageConvertStart, {
        schema: cloudStorageConvertStartSchema,
    });

    server.post("cloud-storage/convert/finish", cloudStorageConvertFinish, {
        schema: cloudStorageConvertFinishSchema,
    });
};
