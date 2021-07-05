import { describe } from "mocha";
import { expect } from "chai";
import { LoggerFormat } from "../../../src/logger/Logger";
import { LoggerPluginTerminal } from "../../../src/logger/plugins/LoggerPluginTerminal";

describe("Logger Plugin Terminal", () => {
    it("test logger context and format", () => {
        const protoConsole = console.log;

        let testLogOutput;
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

        loggerPluginTerminal.output(log);

        expect(testLogOutput).eq(JSON.stringify(log, null, 2));

        console.log = protoConsole;

        type Context = {
            test: number;
        };
    });
});
