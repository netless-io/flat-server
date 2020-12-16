import { Sequelize } from "sequelize";
import { MySQL } from "../../Constants";

export const sequelize = new Sequelize({
    host: MySQL.HOST,
    username: MySQL.USER,
    password: MySQL.PASSWORD,
    database: MySQL.DB,
    port: Number(MySQL.PORT),
    dialect: "mysql",
    logging: false,
});

sequelize.authenticate().catch(err => {
    console.error("Unable to connect to the database");
    console.error(err);
    process.exit(1);
});
