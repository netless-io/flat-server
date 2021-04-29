import os from "os";
import { createLogger, format, Logger, transports } from "winston";
import axios from "axios";

const logger = createLogger({
    level: "debug",
    format: format.combine(
        format.timestamp(),
        format.prettyPrint({
            colorize: process.env.NODE_ENV === "development",
        }),
    ),
    transports: [new transports.Console()],
    defaultMeta: {
        env: process.env.PROJECT_ENV || "local",
        hostname: os.hostname(),
    },
});

const childLogger = (label: string): Logger => {
    return logger.child({
        label,
    });
};

export const loggerAPI = childLogger("api");
export const loggerServer = childLogger("server");

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const parseError = (error: any): void | Record<string, any> => {
    switch (typeof error) {
        case "bigint":
        case "number":
        case "string":
        case "symbol":
        case "function":
        case "boolean": {
            return {
                errorStr: String(error),
            };
        }
        case "undefined": {
            return;
        }
        case "object": {
            if (error === null) {
                return;
            }

            if (axios.isAxiosError(error)) {
                const axiosErrorData: Record<string, string> = {};

                if (error.response?.status) {
                    axiosErrorData.status = String(error.response.status);
                }

                if (error.response?.statusText) {
                    axiosErrorData.statusText = error.response.statusText;
                }

                if (error.response?.config.url) {
                    axiosErrorData.url = error.response?.config.url;
                }

                if (error.response?.config.method) {
                    axiosErrorData.method = error.response?.config.method;
                }

                if (typeof error.response?.data === "object" && error.response.data !== null) {
                    axiosErrorData.data = error.response.data;
                }

                if (error.response?.config.headers) {
                    axiosErrorData.headers = error.response?.config.headers;
                }

                return {
                    axiosErrorData: axiosErrorData,
                };
            }

            return {
                errorData: error,
            };
        }
    }
};
