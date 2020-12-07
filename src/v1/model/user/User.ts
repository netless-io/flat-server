import { UserField } from "../types";
import { mysqlService } from "../../service/MysqlService";
import { RowDataPacket } from "mysql2";
import { dayjs } from "../../../utils/Dayjs";

export const getUserInfo = async (userID: string): Promise<UserField | undefined> => {
    const conn = await mysqlService.getConnection();

    const sql = "SELECT * FROM users WHERE user_id = ?";

    const data = await conn.query(sql, [userID]);
    conn.release();

    const rows = data[0] as UserField[];

    return rows[0];
};

export const updateAvatarURL = async (userID: string, avatarURL: string): Promise<void> => {
    const timestamp = dayjs(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss");
    const conn = await mysqlService.getConnection();

    const sql = "UPDATE users SET avatar_url = ?, updated_at = ? WHERE user_id = ?";

    await conn.query<RowDataPacket[]>(sql, [avatarURL, timestamp, userID]);
    conn.release();
};
