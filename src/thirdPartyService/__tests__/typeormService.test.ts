import test from "ava";
import { orm } from "../TypeORMService";
import sinon from "sinon";
import { loggerServer } from "../../logger";
import { MySQL } from "../../constants/Config";

const namespace = "[thirdPartyService][typeorm]";

test.serial(`${namespace} - connect success`, async ava => {
    const ormConnect = await orm();

    ava.true(ormConnect.isConnected);

    await ormConnect.close();
});

test.serial(`${namespace} - connect failed`, async ava => {
    const stubExit = sinon.stub(process, "exit");
    const stubLoggerError = sinon.stub(loggerServer, "error");

    const pwdBackup = MySQL.password;
    MySQL.password = "test";

    await orm().catch(() => {});

    // @ts-ignore
    ava.is(process.exit.args[0][0], 1);

    MySQL.password = pwdBackup;
    stubExit.restore();
    stubLoggerError.restore();
});
