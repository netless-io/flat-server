/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */

declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: "development" | "production";
        SERVER_PORT: string;

        WEB_WECHAT_APP_ID: string;
        WEB_WECHAT_APP_SECRET: string;
        MOBILE_WECHAT_APP_ID: string;
        MOBILE_WECHAT_APP_SECRET: string;

        GITHUB_CLIENT_ID: string;
        GITHUB_CLIENT_SECRET: string;

        AGORA_APP_ID: string;
        AGORA_APP_CERTIFICATE: string;
        AGORA_RESTFUL_ID: string;
        AGORA_RESTFUL_SECRET: string;
        AGORA_OSS_VENDOR: `${number}`;
        AGORA_OSS_ACCESS_KEY_ID: string;
        AGORA_OSS_ACCESS_KEY_SECRET: string;
        AGORA_OSS_REGION: `${number}`;
        AGORA_OSS_BUCKET: string;
        AGORA_OSS_FOLDER: string;
        AGORA_OSS_PREFIX: string;

        REDIS_HOST: string;
        REDIS_PORT: string;
        REDIS_USERNAME?: string;
        REDIS_PASSWORD: string;
        REDIS_DB: string;

        MYSQL_HOST: string;
        MYSQL_PORT: string;
        MYSQL_USER: string;
        MYSQL_PASSWORD: string;
        MYSQL_DB: string;

        JWT_SECRET: string;
        JWT_ALGORITHMS: string;

        LOG_PATHNAME: string;
        LOG_FILENAME: string;

        METRICS_ENABLED: string;
        METRICS_ENDPOINT: string;
        METRICS_BLACKLIST: string;

        NETLESS_ACCESS_KEY: string;
        NETLESS_SECRET_ACCESS_KEY: string;

        OSS_ACCESS_KEY_ID: string;
        OSS_ACCESS_KEY_SECRET: string;

        CLOUD_STORAGE_SINGLE_FILE_SIZE: string;
        CLOUD_STORAGE_TOTAL_SIZE: string;
        CLOUD_STORAGE_CONCURRENT: string;
        CLOUD_STORAGE_PREFIX_PATH: string;
        CLOUD_STORAGE_ALLOW_FILE_SUFFIX: string;

        ALIBABA_CLOUD_OSS_ACCESS_KEY: string;
        ALIBABA_CLOUD_OSS_ACCESS_KEY_SECRET: string;
        ALIBABA_CLOUD_OSS_BUCKET: string;
        ALIBABA_CLOUD_OSS_REGION: string;
    }
}
