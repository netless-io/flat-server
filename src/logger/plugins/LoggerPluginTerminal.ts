import { LoggerContext, LoggerFormat } from "../Logger";
import { LoggerAbstractPlugin } from "./LoggerAbstractPlugin";

export class LoggerPluginTerminal<C extends LoggerContext> extends LoggerAbstractPlugin<C> {
    public output(log: LoggerFormat<C>): void {
        console.log(JSON.stringify(log, null, 2));
    }
}
