import { format } from "date-fns";

export const timestampFormat = (): string => {
    return format(Date.now(), "yyyy-MM-dd HH:mm:ss");
};
