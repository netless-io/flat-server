import { LoggerContext, LoggerFormat } from "../Logger";

export abstract class LoggerAbstractPlugin<C extends LoggerContext> {
    public abstract output(log: LoggerFormat<Partial<C>>): void;
}
