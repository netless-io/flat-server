import { Connection, createConnection } from "mysql2/promise";
import { Config } from "../type";

export const getConnection = async (config: Config): Promise<Connection> => {
    return await createConnection({
        host: config.MYSQL_HOST,
        port: config.MYSQL_PORT,
        user: config.MYSQL_USERNAME,
        password: config.MYSQL_PASSWORD,
        database: config.MYSQL_DATABASE,
        multipleStatements: true,
    });
};
