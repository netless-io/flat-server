import os from "os";

import { Logger, LoggerContext } from "./Logger";
import {
    LoggerAPI,
    LoggerBase,
    LoggerContentCensorship,
    LoggerError,
    LoggerRTCScreenshot,
    LoggerServer,
    LoggerSMS,
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

export const createLoggerAPI = <R extends LoggerContext>(
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
