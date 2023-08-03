import { DataSource } from "typeorm";
import { CloudStorageConfigsModel } from "../model/cloudStorage/CloudStorageConfigs";
import { CloudStorageFilesModel } from "../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../model/cloudStorage/CloudStorageUserFiles";
import { isDev, isTest, MySQL } from "../constants/Config";
import { RoomModel } from "../model/room/Room";
import { RoomPeriodicModel } from "../model/room/RoomPeriodic";
import { RoomPeriodicConfigModel } from "../model/room/RoomPeriodicConfig";
import { RoomPeriodicUserModel } from "../model/room/RoomPeriodicUser";
import { RoomRecordModel } from "../model/room/RoomRecord";
import { RoomUserModel } from "../model/room/RoomUser";
import { UserModel } from "../model/user/User";
import { UserWeChatModel } from "../model/user/WeChat";
import { UserGithubModel } from "../model/user/Github";
import { loggerServer, parseError } from "../logger";
import { UserAppleModel } from "../model/user/Apple";
import { UserAgoraModel } from "../model/user/Agora";
import { UserGoogleModel } from "../model/user/Google";
import { UserPhoneModel } from "../model/user/Phone";
import { UserSensitiveModel } from "../model/user/Sensitive";
import { OAuthInfosModel } from "../model/oauth/oauth-infos";
import { OAuthSecretsModel } from "../model/oauth/oauth-secrets";
import { OAuthUsersModel } from "../model/oauth/oauth-users";
import { UserEmailModel } from "../model/user/Email";

export const dataSource = new DataSource({
    type: "mysql",
    host: MySQL.host,
    username: MySQL.user,
    password: MySQL.password,
    database: MySQL.db,
    port: MySQL.port,
    entities: [
        UserModel,
        UserWeChatModel,
        UserGithubModel,
        UserAppleModel,
        UserAgoraModel,
        UserGoogleModel,
        UserPhoneModel,
        UserEmailModel,
        UserSensitiveModel,
        RoomModel,
        RoomUserModel,
        RoomPeriodicConfigModel,
        RoomPeriodicModel,
        RoomPeriodicUserModel,
        RoomRecordModel,
        CloudStorageConfigsModel,
        CloudStorageFilesModel,
        CloudStorageUserFilesModel,
        OAuthInfosModel,
        OAuthSecretsModel,
        OAuthUsersModel,
    ],
    extra: {
        connectionLimit: isTest ? 50 : 10,
    },
    timezone: "Z",
    logging: !isTest && isDev ? "all" : false,
    maxQueryExecutionTime: !isTest && isDev ? 1 : 1000,
    charset: "utf8mb4_unicode_ci",
});

export const orm = (): Promise<DataSource> => {
    return dataSource.initialize().catch(err => {
        loggerServer.error("unable to connect to the database", parseError(err));
        process.exit(1);
    });
};
