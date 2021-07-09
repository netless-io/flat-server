import { describe } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { AbstractController, ControllerClassParams } from "../../src/abstract/controller";
import { ResponseError } from "../../src/types/Server";
import { Status } from "../../src/constants/Project";
import { ErrorCode } from "../../src/ErrorCode";
import { createLoggerAPI } from "../../src/logger";

describe("abstract controller", () => {
    it("error handler", () => {
        class Test extends AbstractController<any, any> {
            public execute(): any {
                throw new Error("test");
            }
            public errorHandler(error: Error): ResponseError {
                return this.autoHandlerError(error);
            }
        }

        const test = new Test({
            req: {
                body: {},
                params: {},
                query: {},
                user: {},
            },
            reply: {},
            logger: createLoggerAPI({}),
        } as ControllerClassParams);

        const stubLoggerError = sinon.stub(test.logger, "error");

        let result: ResponseError = {
            status: Status.Failed,
            code: ErrorCode.FileExists,
        };

        try {
            test.execute();
        } catch (error) {
            result = test.errorHandler(error);
        } finally {
            stubLoggerError.restore();
        }

        expect(result.code).eq(ErrorCode.CurrentProcessFailed);
    });
});
