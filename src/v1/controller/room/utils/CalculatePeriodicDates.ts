import { Periodic } from "../Types";
import { dateIntervalByEndTime, dateIntervalByRate, DateIntervalResult } from "./DateInterval";

export const calculatePeriodicDates = (
    beginTime: number,
    endTime: number,
    periodic: Periodic,
): DateIntervalResult[] => {
    if (periodic.rate) {
        return dateIntervalByRate({
            start: beginTime,
            end: endTime,
            rate: periodic.rate,
            weeks: periodic.weeks,
        });
    } else {
        return dateIntervalByEndTime({
            start: beginTime,
            end: endTime,
            endDate: periodic.endTime!,
            weeks: periodic.weeks,
        });
    }
};
