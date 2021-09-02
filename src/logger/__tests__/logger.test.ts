import test from "ava";
import { Logger, LoggerContext, LoggerFormat } from "../Logger";
import { LoggerAbstractPlugin } from "../plugins/LoggerAbstractPlugin";

const namespace = "[logger]";

test(`${namespace} - test logger context and format`, ava => {
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

    ava.is(testLogOutput.label, "test");
    ava.is(testLogOutput.level, "debug");
    ava.is(testLogOutput.message, "test message");
    ava.is(testLogOutput.payload.test, 1);

    // ------------------------

    logger.withContext({
        test: 2,
    });

    logger.info("test message2");

    ava.is(testLogOutput.level, "info");
    ava.is(testLogOutput.payload.test, 2);

    // ------------------------

    logger.warn("test message3", {
        test: 3,
    });

    ava.is(testLogOutput.level, "warn");
    ava.is(testLogOutput.payload.test, 3);

    // ------------------------

    logger.error("test message4", {
        test: 4,
    });

    ava.is(testLogOutput.level, "error");
    ava.is(testLogOutput.message, "test message4");

    type Context = {
        test: number;
    };
});
