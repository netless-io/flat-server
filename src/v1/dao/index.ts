import { DAOImplement } from "./Implement";
import { RoomModel } from "../model/room/Room";
import { DAO } from "./Type";
import { RoomUserModel } from "../model/room/RoomUser";
import { UserModel } from "../model/user/User";
import { UserWeChatModel } from "../model/user/WeChat";
import { RoomPeriodicConfigModel } from "../model/room/RoomPeriodicConfig";
import { RoomPeriodicModel } from "../model/room/RoomPeriodic";
import { RoomDocModel } from "../model/room/RoomDoc";
import { RoomPeriodicUserModel } from "../model/room/RoomPeriodicUser";
import { RoomRecordModel } from "../model/room/RoomRecord";

export const UserDAO = DAOImplement(UserModel) as ReturnType<DAO<UserModel>>;

export const UserWeChatDAO = DAOImplement(UserWeChatModel) as ReturnType<DAO<UserWeChatModel>>;

export const RoomDAO = DAOImplement(RoomModel) as ReturnType<DAO<RoomModel>>;

export const RoomUserDAO = DAOImplement(RoomUserModel) as ReturnType<DAO<RoomUserModel>>;

export const RoomPeriodicConfigDAO = DAOImplement(RoomPeriodicConfigModel) as ReturnType<
    DAO<RoomPeriodicConfigModel>
>;

export const RoomPeriodicDAO = DAOImplement(RoomPeriodicModel) as ReturnType<
    DAO<RoomPeriodicModel>
>;

export const RoomDocDAO = DAOImplement(RoomDocModel) as ReturnType<DAO<RoomDocModel>>;

export const RoomPeriodicUserDAO = DAOImplement(RoomPeriodicUserModel) as ReturnType<
    DAO<RoomPeriodicUserModel>
>;

export const RoomRecordDAO = DAOImplement(RoomRecordModel) as ReturnType<DAO<RoomRecordModel>>;
