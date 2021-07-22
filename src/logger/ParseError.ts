import { LoggerError } from "./LogConext";
import axios from "axios";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const parseError = (error: any): Partial<LoggerError> => {
    switch (typeof error) {
        case "bigint":
        case "number":
        case "string":
        case "symbol":
        case "function":
        case "boolean": {
            return {
                errorString: String(error),
            };
        }
        case "undefined": {
            return {};
        }
        case "object": {
            if (error === null) {
                return {};
            }

            if (axios.isAxiosError(error)) {
                const errorAxios: Record<string, string | number> = {};

                if (error.response?.status) {
                    errorAxios.status = error.response.status;
                }

                if (error.response?.statusText) {
                    errorAxios.statusText = error.response.statusText;
                }

                if (error.response?.config.url) {
                    errorAxios.url = error.response?.config.url;
                }

                if (error.response?.config.method) {
                    errorAxios.method = error.response?.config.method;
                }

                if (typeof error.response?.data === "object" && error.response.data !== null) {
                    errorAxios.data = JSON.stringify(error.response.data);
                }

                if (error.response?.config.headers) {
                    errorAxios.headers = JSON.stringify(error.response?.config.headers);
                }

                return {
                    errorAxios: errorAxios,
                };
            }

            if (error instanceof Error) {
                return {
                    errorMessage: error.message,
                    errorStack: error.stack || "",
                };
            }

            return {
                errorString: JSON.stringify(error),
            };
        }
    }
};
