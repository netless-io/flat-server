import { cloneDeep } from "lodash";
import { format } from "date-fns/fp";
import { FilterValue, removeEmptyValue } from "../utils/Object";
import { LoggerAbstractPlugin } from "./plugins/LoggerAbstractPlugin";

const timestampFormat = format("yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

export class Logger<C extends LoggerContext> {
    private context: Partial<C>;

    constructor(
        private readonly label: string,
        context: Partial<C>,
        private readonly plugins: LoggerAbstractPlugin<C>[],
    ) {
        this.context = cloneDeep(context);
        this.label = label;
    }

    public withContext(context: Partial<C>): void {
        this.context = cloneDeep({
            ...this.context,
            ...context,
        });
    }

    public debug(message: string, meta?: Partial<C>): void {
        this.log("debug", message, meta);
    }

    public info(message: string, meta?: Partial<C>): void {
        this.log("info", message, meta);
    }

    public warn(message: string, meta?: Partial<C>): void {
        this.log("warn", message, meta);
    }

    public error(message: string, meta?: Partial<C>): void {
        this.log("error", message, meta);
    }

    private log(level: LoggerLevel, message: string, meta: Partial<C> = {}): void {
        const log = this.logFormat(level, message, meta);

        this.plugins.forEach(plugin => {
            plugin.output(log);
        });
    }

    private logFormat(
        level: LoggerLevel,
        message: string,
        meta: Partial<C>,
    ): LoggerFormat<Partial<C>> {
        return {
            timestamp: timestampFormat(Date.now()),
            label: this.label,
            level,
            message,
            payload: removeEmptyValue(
                {
                    ...this.context,
                    ...meta,
                },
                [
                    FilterValue.UNDEFINED,
                    FilterValue.EMPTY_OBJECT,
                    FilterValue.NULL,
                    FilterValue.NAN,
                ],
            ),
        };
    }
}

export type LoggerContext = RecursionObject<string | number | boolean | undefined>;

export type LoggerLevel = "debug" | "info" | "warn" | "error";

export type LoggerFormat<C> = {
    timestamp: string;
    label: string;
    level: LoggerLevel;
    message: string;
    payload: C;
};
