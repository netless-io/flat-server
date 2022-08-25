import { DataSource } from "typeorm";
import { getConfig } from "./getConfig";
import path from "path";

const config = getConfig(path.join(__dirname, "..", ".env.yaml"));

export const dataSource = new DataSource({
    type: "mysql",
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    username: config.MYSQL_USERNAME,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DATABASE,
    multipleStatements: true,
});
