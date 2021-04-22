import { createConnection } from "typeorm";
import { CloudStorageConfigsModel } from "../model/cloudStorage/CloudStorageConfigs";
import { CloudStorageFilesModel } from "../model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../model/cloudStorage/CloudStorageUserFiles";
import { isDev, MySQL } from "../../Constants";
import { RoomModel } from "../model/room/Room";
import { RoomDocModel } from "../model/room/RoomDoc";
import { RoomPeriodicModel } from "../model/room/RoomPeriodic";
import { RoomPeriodicConfigModel } from "../model/room/RoomPeriodicConfig";
import { RoomPeriodicUserModel } from "../model/room/RoomPeriodicUser";
import { RoomRecordModel } from "../model/room/RoomRecord";
import { RoomUserModel } from "../model/room/RoomUser";
import { UserModel } from "../model/user/User";
import { UserWeChatModel } from "../model/user/WeChat";

export const orm = createConnection({
    type: "mysql",
    host: MySQL.HOST,
    username: MySQL.USER,
    password: MySQL.PASSWORD,
    database: MySQL.DB,
    port: Number(MySQL.PORT),
    entities: [
        UserModel,
        UserWeChatModel,
        RoomModel,
        RoomUserModel,
        RoomPeriodicConfigModel,
        RoomPeriodicModel,
        RoomDocModel,
        RoomPeriodicUserModel,
        RoomRecordModel,
        CloudStorageConfigsModel,
        CloudStorageFilesModel,
        CloudStorageUserFilesModel,
    ],
    timezone: "Z",
    logging: isDev ? "all" : false,
    maxQueryExecutionTime: isDev ? 1 : 1000,
    charset: "utf8mb4_unicode_ci",
}).catch(err => {
    console.error("Unable to connect to the database");
    console.error(err);
    process.exit(1);
});
