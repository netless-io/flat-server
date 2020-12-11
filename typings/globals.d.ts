/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */

declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: "development" | "production";
        SERVER_PORT: string;

        WECHAT_APP_ID: string;
        WECHAT_APP_SECRET: string;

        AGORA_APP_ID: string;
        AGORA_APP_CERTIFICATE: string;

        REDIS_HOST: string;
        REDIS_PORT: string;
        REDIS_PASSWORD: string;
        REDIS_DB: string;

        MYSQL_HOST: string;
        MYSQL_PORT: string;
        MYSQL_USER: string;
        MYSQL_PASSWORD: string;
        MYSQL_DB: string;
    }
}
