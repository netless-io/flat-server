import { Connection, createConnection } from "typeorm";
import { CloudStorageConfigsModel } from "../model/cloudStorage/CloudStorageConfigs";
import { CloudStorageFilesModel } from "../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../model/cloudStorage/CloudStorageUserFiles";
import { isDev, isTest, MySQL } from "../constants/Process";
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

export const orm = (): Promise<Connection> => {
    return createConnection({
        type: "mysql",
        host: MySQL.HOST,
        username: MySQL.USER,
        password: MySQL.PASSWORD,
        database: MySQL.DB,
        port: Number(MySQL.PORT),
        entities: [
            UserModel,
            UserWeChatModel,
            UserGithubModel,
            UserAppleModel,
            RoomModel,
            RoomUserModel,
            RoomPeriodicConfigModel,
            RoomPeriodicModel,
            RoomPeriodicUserModel,
            RoomRecordModel,
            CloudStorageConfigsModel,
            CloudStorageFilesModel,
            CloudStorageUserFilesModel,
        ],
        timezone: "Z",
        logging: !isTest && isDev ? "all" : false,
        maxQueryExecutionTime: !isTest && isDev ? 1 : 1000,
        charset: "utf8mb4_unicode_ci",
    }).catch(err => {
        loggerServer.error("unable to connect to the database", parseError(err));
        process.exit(1);
    });
};
