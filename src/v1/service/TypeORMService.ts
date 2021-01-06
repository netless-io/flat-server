import { isDev, MySQL } from "../../Constants";
import { createConnection } from "typeorm";
import { RoomModel } from "../model/room/Room";
import { RoomUserModel } from "../model/room/RoomUser";
import { RoomPeriodicModel } from "../model/room/RoomPeriodic";
import { RoomDocModel } from "../model/room/RoomDoc";
import { UserModel } from "../model/user/User";
import { UserWeChatModel } from "../model/user/WeChat";
import { RoomPeriodicConfigModel } from "../model/room/RoomPeriodicConfig";
import { RoomPeriodicUserModel } from "../model/room/RoomPeriodicUser";

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
    ],
    timezone: "Z",
    logging: isDev ? "all" : false,
    maxQueryExecutionTime: isDev ? 1 : 1000,
}).catch(err => {
    console.error("Unable to connect to the database");
    console.error(err);
    process.exit(1);
});
