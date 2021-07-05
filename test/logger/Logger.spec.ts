import { describe } from "mocha";
import { expect } from "chai";
import { Logger, LoggerContext, LoggerFormat } from "../../src/logger/Logger";
import { LoggerAbstractPlugin } from "../../src/logger/plugins/LoggerAbstractPlugin";

describe("Logger", () => {
    it("test logger context and format", () => {
        let testLogOutput: LoggerFormat<Partial<Context>> = {} as LoggerFormat<Partial<Context>>;

        class TestPlugin<C extends LoggerContext> extends LoggerAbstractPlugin<C> {
            public output(log: LoggerFormat<Partial<C>>): void {
                testLogOutput = log;
            }
        }

        const logger = new Logger<Context>(
            "test",
            {
                test: 1,
            },
            [new TestPlugin<Context>()],
        );

        logger.debug("test message");

        expect(testLogOutput).keys(["timestamp", "label", "level", "message", "payload"]);
        expect(testLogOutput.label).eq("test");
        expect(testLogOutput.level).eq("debug");
        expect(testLogOutput.message).eq("test message");
        expect(testLogOutput.payload.test).eq(1);

        // ------------------------

        logger.withContext({
            test: 2,
        });

        logger.info("test message2");

        expect(testLogOutput.level).eq("info");
        expect(testLogOutput.payload.test).eq(2);

        // ------------------------

        logger.warn("test message3", {
            test: 3,
        });

        expect(testLogOutput.level).eq("warn");
        expect(testLogOutput.payload.test).eq(3);

        // ------------------------

        logger.error("test message3", {
            test: 3,
        });

        expect(testLogOutput.message).eq("test message3");

        type Context = {
            test: number;
        };
    });
});
