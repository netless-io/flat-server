import { describe } from "mocha";
import { expect } from "chai";
import os from "os";
import path from "path";
import { v4 } from "uuid";
import fs from "fs-extra";
import { LoggerFormat } from "../../../src/logger/Logger";
import { LoggerPluginFile } from "../../../src/logger/plugins/LoggerPluginFile";

describe("Logger Plugin Terminal", () => {
    it("test logger context and format", () => {
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

        expect(fs.existsSync(filepath)).true;

        const fileContent = fs.readFileSync(filepath, {
            encoding: "utf-8",
        });

        expect(fileContent[fileContent.length - 1]).eq("\n");

        expect(fileContent.trim()).eq(JSON.stringify(log));

        fs.removeSync(filepath);

        type Context = {
            test: number;
        };
    });
});
