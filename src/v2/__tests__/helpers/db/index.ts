import { EntityManager } from "typeorm";
import { CreateCloudStorageConfigs } from "./cloud-storage-configs";
import { CreateCloudStorageFiles } from "./cloud-storage-files";
import { CreateCloudStorageUserFiles } from "./cloud-storage-user-files";
import { CreateCS } from "./create-cs-files";

export const testService = (t: EntityManager) => {
    return {
        createCloudStorageConfigs: new CreateCloudStorageConfigs(t),
        createCloudStorageFiles: new CreateCloudStorageFiles(t),
        createCloudStorageUserFiles: new CreateCloudStorageUserFiles(t),
        createCS: new CreateCS(t),
    };
};
