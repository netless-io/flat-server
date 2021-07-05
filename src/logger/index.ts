import os from "os";

import { Logger, LoggerContext } from "./Logger";
import { LoggerAPI, LoggerError, LoggerServer, LoggerBase } from "./LogConext";
import { LoggerPluginFile } from "./plugins/LoggerPluginFile";
import { LoggerPluginTerminal } from "./plugins/LoggerPluginTerminal";
import { LoggerAbstractPlugin } from "./plugins/LoggerAbstractPlugin";
import { LogConfig } from "../constants/Process";

export { Logger };
export { LoggerServer, LoggerBase, LoggerAPI, LoggerError };
export { parseError } from "./ParseError";

const baseContext = {
    hostname: os.hostname(),
};

const loggerPlugins = [
    new LoggerPluginTerminal(),
    new LoggerPluginFile(LogConfig.PATHNAME, LogConfig.FILENAME),
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
