import { EntityManager } from "typeorm";
import { CreateCloudStorageConfigs } from "./cloud-storage-configs";
import { CreateCloudStorageFiles } from "./cloud-storage-files";
import { CreateCloudStorageUserFiles } from "./cloud-storage-user-files";
import { CreateCS } from "./create-cs-files";
import { CreateUser } from "./user";
import { CreateOAuthInfos } from "./oauth-infos";
import { CreateUsersInfos } from "./oauth-users";
import { CreateSecretsInfos } from "./oauth-secret";

export const testService = (t: EntityManager) => {
    return {
        createCloudStorageConfigs: new CreateCloudStorageConfigs(t),
        createCloudStorageFiles: new CreateCloudStorageFiles(t),
        createCloudStorageUserFiles: new CreateCloudStorageUserFiles(t),
        createCS: new CreateCS(t),
        createUser: new CreateUser(t),
        createOAuthInfos: new CreateOAuthInfos(t),
        createOAuthUsers: new CreateUsersInfos(t),
        createSecretsInfos: new CreateSecretsInfos(t),
    };
};
