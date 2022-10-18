/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */

declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: "development" | "production";

        METRICS_ENABLED: string;
        METRICS_ENDPOINT: string;
        METRICS_PORT: string;
    }
}

declare module "*.eta" {
    const a: string;
    export default a;
}
