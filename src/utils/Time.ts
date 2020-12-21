import { toDate } from "date-fns/fp";
import { DateUtils } from "typeorm/util/DateUtils";

export const UTCDate = (time: string | Date | number = new Date()) => {
    if (typeof time === "number") {
        return DateUtils.mixedDateToDate(toDate(time), true);
    }
    return DateUtils.mixedDateToDate(time, true);
};
