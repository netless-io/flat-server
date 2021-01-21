import { Periodic } from "../Types";
import { toDate } from "date-fns/fp";
import { dateIntervalByEndTime, dateIntervalByRate, DateIntervalResult } from "./DateInterval";
import {
    beginTimeLessEndTime,
    beginTimeLessRedundancyOneMinute,
    timeIntervalLessThanOrEqualFifteenMinute,
} from "./CheckTime";

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

export const checkPeriodicTime = (beginTime: number, endTime: number): boolean => {
    if (beginTimeLessRedundancyOneMinute(beginTime)) {
        return false;
    }

    if (beginTimeLessEndTime(beginTime, endTime)) {
        return false;
    }

    // the interval between the start time and the end time must be greater than 15 minutes
    if (timeIntervalLessThanOrEqualFifteenMinute(beginTime, endTime)) {
        return false;
    }

    return true;
};
