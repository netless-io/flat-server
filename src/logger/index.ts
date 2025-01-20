import os from "os";

import { Logger, LoggerContext } from "./Logger";
import {
    LoggerAPI,
    LoggerAPIv2,
    LoggerBase,
    LoggerContentCensorship,
    LoggerError,
    LoggerRTCScreenshot,
    LoggerRTCVoice,
    LoggerServer,
    LoggerService,
    LoggerSMS,
    LoggerEmail,
} from "./LogConext";
import { LoggerPluginFile } from "./plugins/LoggerPluginFile";
import { LoggerPluginTerminal } from "./plugins/LoggerPluginTerminal";
import { LoggerAbstractPlugin } from "./plugins/LoggerAbstractPlugin";
import { LogConfig } from "../constants/Config";

export { Logger };
export { LoggerServer, LoggerBase, LoggerAPI, LoggerError };
export { parseError } from "./ParseError";

const baseContext = {
    hostname: os.hostname(),
};

const loggerPlugins = [
    new LoggerPluginTerminal(),
    new LoggerPluginFile(LogConfig.pathname, LogConfig.filename),
];


export const createLoggerAPIv1 = <R extends LoggerContext>(
    context: Partial<LoggerAPI & R>,
): Logger<LoggerAPI & R> => {
    return new Logger<LoggerAPI & R>(
        "api",
        {
            ...context,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<LoggerAPI & R>[],
    );
};

export const createLoggerAPIv2 = <R extends LoggerContext>(
    context: Partial<LoggerAPIv2 & R>,
): Logger<LoggerAPIv2 & R> => {
    return new Logger<LoggerAPIv2 & R>(
        "api",
        {
            ...context,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<LoggerAPIv2 & R>[],
    );
};

const createLoggerForRuntime = <R extends LoggerContext>(
    context: Partial<R>,
): Logger<R> => {
    return new Logger<R>(
        "api",
        {
            ...context,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<R>[],
    );
};


export const createLoggerService = <T extends string>(
    context: Partial<
        Omit<LoggerService<T>, "requestID" | "sessionID"> & {
            ids: IDS;
        }
    >,
): Logger<LoggerService<T>> => {
    const { ids, ...rest } = context;
    const reqAndSesID = ids
        ? {
              requestID: ids.reqID,
              sessionID: ids.sesID,
          }
        : null;
    return new Logger<LoggerService<T>>(
        "service",
        // @ts-ignore
        {
            ...reqAndSesID,
            ...rest,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<LoggerService<T>>[],
    );
};

export const loggerServer = new Logger<LoggerServer>(
    "server",
    {
        ...baseContext,
    },
    loggerPlugins,
);

export const createLoggerSMS = <R extends LoggerContext>(
    context: Partial<LoggerSMS & R>,
): Logger<LoggerSMS & R> => {
    return new Logger<LoggerSMS & R>(
        "sms",
        {
            ...context,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<LoggerSMS & R>[],
    );
};

export const createLoggerEmail = <R extends LoggerContext>(
    context: Partial<LoggerEmail & R>,
): Logger<LoggerEmail & R> => {
    return new Logger<LoggerEmail & R>(
        "email",
        {
            ...context,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<LoggerEmail & R>[],
    );
};

export const createLoggerRTCScreenshot = <R extends LoggerContext>(
    context: Partial<LoggerRTCScreenshot & R>,
): Logger<LoggerRTCScreenshot & R> => {
    return new Logger<LoggerRTCScreenshot & R>(
        "queue",
        {
            ...context,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<LoggerRTCScreenshot & R>[],
    );
};

export const createLoggerRTCVoice = <R extends LoggerContext>(
    context: Partial<LoggerRTCVoice & R>,
): Logger<LoggerRTCVoice & R> => {
    return new Logger<LoggerRTCVoice & R>(
        "queue",
        {
            ...context,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<LoggerRTCVoice & R>[],
    );
};

export const createLoggerContentCensorship = <R extends LoggerContext>(
    context: Partial<LoggerContentCensorship & R>,
): Logger<LoggerContentCensorship & R> => {
    return new Logger<LoggerContentCensorship & R>(
        "censorship",
        {
            ...context,
            ...baseContext,
        },
        loggerPlugins as LoggerAbstractPlugin<LoggerContentCensorship & R>[],
    );
};

export const runTimeLogger = createLoggerForRuntime({})
