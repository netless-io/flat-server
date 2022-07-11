import { LoggerContext, LoggerFormat } from "../Logger";
import { LoggerAbstractPlugin } from "./LoggerAbstractPlugin";

export class LoggerPluginTerminal<C extends LoggerContext> extends LoggerAbstractPlugin<C> {
    public output(log: LoggerFormat<C>): void {
        if (process.env.IS_TEST !== "yes") {
            console.log(JSON.stringify(log, null, 2));
        }
    }
}
