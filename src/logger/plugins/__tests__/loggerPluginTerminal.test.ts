import test from "ava";
import type { LoggerFormat } from "../../Logger";
import { LoggerPluginTerminal } from "../LoggerPluginTerminal";

const namespace = "[logger][logger-plugin][logger-plugin-terminal]";

test(`${namespace} - test logger context and format`, ava => {
    const protoConsole = console.log;

    let testLogOutput: undefined | string;
    console.log = (log: string) => {
        testLogOutput = log;
    };

    const loggerPluginTerminal = new LoggerPluginTerminal<Context>();

    const log: LoggerFormat<Context> = {
        timestamp: "time",
        label: "test",
        level: "info",
        message: "xx",
        payload: {
            test: 1,
        },
    };

    process.env.IS_TEST = "NO";
    loggerPluginTerminal.output(log);

    ava.is(testLogOutput, JSON.stringify(log, null, 2));

    console.log = protoConsole;
    process.env.IS_TEST = "YES";

    type Context = {
        test: number;
    };
});
