import { Method } from "axios";

export type LoggerError = {
    errorString: string;
    errorMessage: string;
    errorStack: string;
    errorAxios: {
        status?: number;
        statusText?: string;
        url?: string;
        method?: Method;
        data?: string;
        headers?: string;
    };
};

export type LoggerBase = LoggerError & {
    hostname: string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type LoggerServer = LoggerBase & {};

export type LoggerAPI = LoggerBase & {
    requestPath: string;
    requestVersion: string;
    user: {
        userUUID: string;
        loginSource: string;
        iat: number;
        exp: number;
    };
    durationMS: number;
};
