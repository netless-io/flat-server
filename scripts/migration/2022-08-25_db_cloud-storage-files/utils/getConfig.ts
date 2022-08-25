import fs from "fs";
import yaml from "js-yaml";
import Ajv from "ajv";
import { Config } from "../type";

export const getConfig = (envPath: string): Config => {
    if (!fs.existsSync(envPath)) {
        throw new Error(`cannot find ${envPath}`);
    }

    const config = yaml.load(fs.readFileSync(envPath, "utf8")) as Config;

    configValidate(config);

    return config;
};

const configValidate = (config: Config): void => {
    const ajv = new Ajv();

    const validate = ajv.compile({
        type: "object",
        required: [
            "MYSQL_HOST",
            "MYSQL_PORT",
            "MYSQL_USERNAME",
            "MYSQL_PASSWORD",
            "MYSQL_DATABASE",
        ],
        properties: {
            MYSQL_HOST: {
                type: "string",
            },
            MYSQL_PORT: {
                type: "integer",
            },
            MYSQL_USERNAME: {
                type: "string",
            },
            MYSQL_PASSWORD: {
                type: "string",
            },
            MYSQL_DATABASE: {
                type: "string",
            },
        },
    });

    validate(config);

    if (validate.errors !== null) {
        console.error(validate.errors);
        throw new Error("config error!");
    }
};
