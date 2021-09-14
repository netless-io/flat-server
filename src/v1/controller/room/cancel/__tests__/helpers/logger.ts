import { LoggerContext, LoggerFormat } from "../../../../../../logger/Logger";
import { LoggerAbstractPlugin } from "../../../../../../logger/plugins/LoggerAbstractPlugin";

export class LoggerPluginTest<C extends LoggerContext> extends LoggerAbstractPlugin<C> {
    public constructor(private readonly flag: { trigger: boolean }) {
        super();
    }
    public output(_log: LoggerFormat<C>): void {
        this.flag.trigger = true;
    }
}
