import { appendFileSync, ensureDirSync, existsSync } from "fs-extra";
import filenamify from "filenamify";
import { envVariable } from "../../utils/EnvVariable";
import path from "path";
import { LoggerContext, LoggerFormat } from "../Logger";
import { LoggerAbstractPlugin } from "./LoggerAbstractPlugin";

export class LoggerPluginFile<C extends LoggerContext> extends LoggerAbstractPlugin<C> {
    public constructor(private readonly pathname: string, private readonly filename: string) {
        super();
    }
    public output(log: LoggerFormat<C>): void {
        appendFileSync(this.logFilePath, `${JSON.stringify(log)}\n`);
    }

    private get logFilePath(): string {
        const pathname = filenamify.path(envVariable.parse(this.pathname), {
            replacement: "-",
        });

        const filename = filenamify(envVariable.parse(this.filename), {
            replacement: "-",
        });

        const filePath = `${path.join(pathname, filename)}.log`;

        if (!existsSync(pathname)) {
            ensureDirSync(pathname);
        }

        return filePath;
    }
}
