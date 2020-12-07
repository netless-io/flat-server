import mysql from "mysql2/promise";
import { MySQL } from "../../Constants";

export const mysqlService = mysql.createPool({
    host: MySQL.HOST,
    port: Number(MySQL.PORT),
    user: MySQL.USER,
    password: MySQL.PASSWORD,
    database: MySQL.DB,
});
