import test from "ava";
import os from "os";
import path from "path";
import { v4 } from "uuid";
import fs from "fs-extra";
import { LoggerPluginFile } from "../LoggerPluginFile";
import type { LoggerFormat } from "../../Logger";

const namespace = "[logger][logger-plugin][logger-plugin-file]";

test(`${namespace} - test logger context and format`, ava => {
    const pathname = path.join(os.tmpdir(), "flat-server", v4());
    const filename = v4();

    const loggerPluginFile = new LoggerPluginFile<Context>(pathname, filename);

    const log: LoggerFormat<Context> = {
        timestamp: "time",
        label: "test",
        level: "info",
        message: "xx",
        payload: {
            test: 1,
        },
    };

    loggerPluginFile.output(log);

    const filepath = path.join(pathname, `${filename}.log`);

    ava.true(fs.existsSync(filepath));

    const fileContent = fs.readFileSync(filepath, {
        encoding: "utf-8",
    });

    ava.is(fileContent[fileContent.length - 1], "\n");

    ava.is(fileContent.trim(), JSON.stringify(log));

    fs.removeSync(filepath);

    type Context = {
        test: number;
    };
});
