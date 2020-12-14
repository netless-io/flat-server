import { v4 } from "uuid";
import { RowDataPacket } from "mysql2";
import { dayjs } from "../../../utils/Dayjs";
import { mysqlService } from "../../service/MysqlService";
import { WeChatUserField } from "../types";
import { LoginPlatform } from "../../../Constants";

export const getWeChatUserInfo = async (userID: string): Promise<WeChatUserField | undefined> => {
    const conn = await mysqlService.getConnection();

    const sql = "SELECT * FROM user_wechat WHERE user_id = ?";

    const data = await conn.query(sql, [userID]);
    conn.release();

    const rows = data[0] as WeChatUserField[];

    return rows[0];
};

export const getWeChatUserID = async (openID: string): Promise<string | undefined> => {
    const conn = await mysqlService.getConnection();

    const sql = "SELECT user_id from user_wechat WHERE open_id = ?";

    const data = await conn.query<RowDataPacket[]>(sql, [openID]);
    conn.release();

    const rows = data[0] as Pick<WeChatUserField, "user_id">[];

    return rows[0] ? rows[0].user_id : undefined;
};

export const registerUser = async (userInfo: SetUserInfo): Promise<string> => {
    const { name, avatarURL, sex, openID, unionID } = userInfo;
    const conn = await mysqlService.getConnection();

    const insertUser = `INSERT INTO users
        (name, avatar_url, phone, password, created_at, updated_at, last_login_platform, user_id, sex)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertWeChatUser = `INSERT INTO user_wechat
        (user_id, open_id, union_id)
        VALUES(?, ?, ?)`;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const uuid = v4();
    const timestamp = dayjs(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss");

    await conn.query(insertUser, [
        name,
        avatarURL,
        "",
        "",
        timestamp,
        timestamp,
        LoginPlatform.WeChat,
        uuid,
        sex,
    ]);
    await conn.query(insertWeChatUser, [uuid, openID, unionID]);

    conn.release();

    return uuid;
};

export type SetUserInfo = {
    name: string;
    avatarURL: string;
    sex: 0 | 1 | 2;
    openID: string;
    unionID: string;
};
