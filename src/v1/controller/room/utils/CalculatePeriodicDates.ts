import { Periodic } from "../Types";
import { toDate } from "date-fns/fp";
import { dateIntervalByEndTime, dateIntervalByRate, DateIntervalResult } from "./DateInterval";

export const calculatePeriodicDates = (
    beginTime: number,
    endTime: number,
    periodic: Periodic,
): DateIntervalResult[] => {
    const beginDateTime = toDate(beginTime);
    const endDateTime = toDate(endTime);

    if (typeof periodic.rate === "number") {
        return dateIntervalByRate({
            start: beginDateTime,
            end: endDateTime,
            rate: periodic.rate,
            weeks: periodic.weeks,
        });
    } else {
        return dateIntervalByEndTime({
            start: beginDateTime,
            end: endDateTime,
            endDate: toDate(periodic.endTime as number),
            weeks: periodic.weeks,
        });
    }
};
