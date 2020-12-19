import { format } from "date-fns/fp";

export const timestampFormat = (time: number | Date = Date.now()): string => {
    return format("yyyy-MM-dd HH:mm:ss.SSS")(time);
};
