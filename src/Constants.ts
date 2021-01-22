import packages from "../package.json";

export const isDev = process.env.NODE_ENV === "development";

export const Server = {
    PORT: process.env.SERVER_PORT,
    NAME: "flat-server",
    VERSION: packages.version,
};

export const Redis = {
    HOST: process.env.REDIS_HOST,
    PORT: process.env.REDIS_PORT,
    PASSWORD: process.env.REDIS_PASSWORD,
    DB: process.env.REDIS_DB,
};

export const MySQL = {
    HOST: process.env.MYSQL_HOST,
    PORT: process.env.MYSQL_PORT,
    USER: process.env.MYSQL_USER,
    PASSWORD: process.env.MYSQL_PASSWORD,
    DB: process.env.MYSQL_DB,
};

export const WeChat = {
    APP_ID: process.env.WECHAT_APP_ID,
    APP_SECRET: process.env.WECHAT_APP_SECRET,
};

export const Agora = {
    APP_ID: process.env.AGORA_APP_ID,
    APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE,
    RESTFUL_ID: process.env.AGORA_RESTFUL_ID,
    RESTFUL_SECRET: process.env.AGORA_RESTFUL_SECRET,
    OSS_VENDOR: process.env.AGORA_OSS_VENDOR,
    OSS_ACCESS_KEY_ID: process.env.AGORA_OSS_ACCESS_KEY_ID,
    OSS_ACCESS_KEY_SECRET: process.env.AGORA_OSS_ACCESS_KEY_SECRET,
    OSS_REGION: process.env.AGORA_OSS_REGION,
    OSS_BUCKET: process.env.AGORA_OSS_BUCKET,
    OSS_FOLDER: process.env.AGORA_OSS_FOLDER,
    OSS_PREFIX: process.env.AGORA_OSS_PREFIX,
};

export const JWT = {
    SECRET: process.env.JWT_SECRET,
    ALGORITHMS: process.env.JWT_ALGORITHMS,
};

export const Netless = {
    ACCESS_KEY: process.env.NETLESS_ACCESS_KEY,
    SECRET_ACCESS_KEY: process.env.NETLESS_SECRET_ACCESS_KEY,
};

export enum Status {
    NoLogin = -1,
    Success,
    Failed,
    Process,
    AuthFailed,
}

export enum WeChatSocketEvents {
    AuthID = "WeChat/AuthID",
    LoginStatus = "WeChat/LoginStatus",
}

export enum SocketNsp {
    Login = "Login",
}
