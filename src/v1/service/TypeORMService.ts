import { MySQL } from "../../Constants";
import { createConnection } from "typeorm";
import { RoomModel } from "../model/room/Room";
import { RoomUserModel } from "../model/room/RoomUser";
import { RoomCyclicalModel } from "../model/room/RoomCyclical";
import { RoomDocModel } from "../model/room/RoomDoc";
import { UserModel } from "../model/user/User";
import { UserWeChatModel } from "../model/user/WeChat";
import { RoomCyclicalConfigModel } from "../model/room/RoomCyclicalConfig";

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
        RoomCyclicalConfigModel,
        RoomCyclicalModel,
        RoomDocModel,
    ],
}).catch(err => {
    console.error("Unable to connect to the database");
    console.error(err);
    process.exit(1);
});
