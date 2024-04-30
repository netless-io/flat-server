import { EntityManager } from "typeorm";
import { CreateCloudStorageConfigs } from "./cloud-storage-configs";
import { CreateCloudStorageFiles } from "./cloud-storage-files";
import { CreateCloudStorageUserFiles } from "./cloud-storage-user-files";
import { CreateCS } from "./create-cs-files";
import { CreateUser } from "./user";
import { CreateOAuthInfos } from "./oauth-infos";
import { CreateUsersInfos } from "./oauth-users";
import { CreateSecretsInfos } from "./oauth-secret";
import { CreateRoomJoin } from "./room-join";
import { CreateRoom } from "./room";
import { CreateUserPhone } from "./user-phone";
import { CreateUserWeChat } from "./user-wechat";
import { CreateUserEmail } from "./user-email";
import { CreatePartner } from "./partner";

export const testService = (t: EntityManager) => {
    return {
        createCloudStorageConfigs: new CreateCloudStorageConfigs(t),
        createCloudStorageFiles: new CreateCloudStorageFiles(t),
        createCloudStorageUserFiles: new CreateCloudStorageUserFiles(t),
        createCS: new CreateCS(t),
        createOAuthInfos: new CreateOAuthInfos(t),
        createOAuthUsers: new CreateUsersInfos(t),
        createRoom: new CreateRoom(t),
        createRoomJoin: new CreateRoomJoin(t),
        createSecretsInfos: new CreateSecretsInfos(t),
        createUser: new CreateUser(t),
        createUserPhone: new CreateUserPhone(t),
        createUserWeChat: new CreateUserWeChat(t),
        createUserEmail: new CreateUserEmail(t),
        createPartner: new CreatePartner(t),
    };
};
