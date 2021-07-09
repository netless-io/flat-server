import { describe } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { orm } from "../../src/thirdPartyService/TypeORMService";
import { MySQL } from "../../src/constants/Process";
import { loggerServer } from "../../src/logger";

describe("thirdPartyService typeORM service", () => {
    it("connect success", async () => {
        const ormConnect = await orm();

        expect(ormConnect.isConnected).eq(true);

        await ormConnect.close();
    });

    it("connect failed", async () => {
        const stubExit = sinon.stub(process, "exit");
        const stubLoggerError = sinon.stub(loggerServer, "error");

        const pwdBackup = MySQL.PASSWORD;
        MySQL.PASSWORD = "test";

        await orm().catch(() => {});

        // @ts-ignore
        expect(process.exit.args[0][0]).eq(1);

        MySQL.PASSWORD = pwdBackup;
        stubExit.restore();
        stubLoggerError.restore();
    });
});
