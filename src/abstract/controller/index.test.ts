import test from "ava";
import { AbstractController, ControllerClassParams } from "./";
import { ResponseError } from "../../types/Server";
import { createLoggerAPIv1 } from "../../logger";
import { ErrorCode } from "../../ErrorCode";
import { ControllerError } from "../../error/ControllerError";

const namespace = "[abstract][abstract-controller]";

test(`${namespace} - abstract controller capture normal error`, ava => {
    ava.plan(1);

    class TestClass extends AbstractController<any, any> {
        public execute(): any {
            throw new Error("test");
        }
        public errorHandler(error: Error): ResponseError {
            return this.autoHandlerError(error);
        }
    }

    const testClass = new TestClass({
        req: {},
        logger: {
            error: () => {},
        },
    } as unknown as ControllerClassParams);

    try {
        testClass.execute();
        ava.fail("should failed");
    } catch (error) {
        const result = testClass.errorHandler(error);
        ava.is(result.code, ErrorCode.CurrentProcessFailed);
    }
});

test(`${namespace} - abstract controller capture controller error`, ava => {
    ava.plan(1);

    class TestClass extends AbstractController<any, any> {
        public execute(): any {
            throw new ControllerError(ErrorCode.NotPermission);
        }
        public errorHandler(error: Error): ResponseError {
            return this.autoHandlerError(error);
        }
    }

    const testClass = new TestClass({
        req: {},
        logger: createLoggerAPIv1({}),
    } as ControllerClassParams);

    try {
        testClass.execute();
        ava.fail("should failed");
    } catch (error) {
        const result = testClass.errorHandler(error);
        ava.is(result.code, ErrorCode.NotPermission);
    }
});
