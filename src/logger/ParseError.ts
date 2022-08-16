import { LoggerError } from "./LogConext";
import axios from "axios";
import { QueryFailedError } from "typeorm";

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

            if (error instanceof QueryFailedError) {
                const errorQuery: Record<string, string | number> = {};

                if ("code" in error.driverError) {
                    errorQuery.code = error.driverError.code;
                }

                if ("sqlMessage" in error.driverError) {
                    errorQuery.sqlMessage = error.driverError.sqlMessage;
                }

                if ("message" in error.driverError) {
                    errorQuery.message = error.driverError.message;
                }

                if ("sqlState" in error.driverError) {
                    errorQuery.sqlState = error.driverError.sqlState;
                }

                errorQuery.query = error.query;

                return {
                    errorQuery,
                };
            }

            if (error instanceof Error) {
                return {
                    errorMessage: error.message,
                    errorStack: error.stack,
                };
            }

            return {
                errorString: JSON.stringify(error),
            };
        }
    }
};
