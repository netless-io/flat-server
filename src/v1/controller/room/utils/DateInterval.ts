import { Week } from "../../../../model/room/Constants";

const MillisecondsInOneDay = 24 * 60 * 60 * 1000;
const UTC8Offset = -480 * 60 * 1000;
const SelfOffset = new Date().getTimezoneOffset() * 60 * 1000;

const isInWeeks = (date: number, weeks: Week[]): boolean => {
    const day = new Date(date + SelfOffset - UTC8Offset).getDay();
    return weeks.includes(day as Week);
};

export const dateIntervalByEndTime = ({
    start,
    end,
    endDate,
    weeks,
}: DateIntervalByWeekParams): DateIntervalResult[] => {
    if (endDate < start) {
        throw new Error("The periodic end time cannot be less than the creation room begin time");
    }

    if (endDate === start) {
        return [{ start: new Date(start), end: new Date(end) }];
    }

    const duration = end - start;

    const allDays: number[] = [];
    for (let now = start; now <= endDate; now += MillisecondsInOneDay) {
        allDays.push(now);
    }

    const result: DateIntervalResult[] = [];
    for (const date of allDays) {
        if (isInWeeks(date, weeks)) {
            result.push({
                start: new Date(date),
                end: new Date(date + duration),
            });
        }
    }

    return result;
};

export const dateIntervalByRate = ({
    start,
    end,
    rate,
    weeks,
}: DateIntervalByRateParams): DateIntervalResult[] => {
    const duration = end - start;

    const result: DateIntervalResult[] = [];
    for (let now = start; result.length < rate; now += MillisecondsInOneDay) {
        if (isInWeeks(now, weeks)) {
            result.push({
                start: new Date(now),
                end: new Date(now + duration),
            });
        }
    }

    return result;
};

interface DateIntervalByWeekParams {
    start: number;
    end: number;
    endDate: number;
    weeks: Week[];
}

interface DateIntervalByRateParams {
    start: number;
    end: number;
    rate: number;
    weeks: Week[];
}

export interface DateIntervalResult {
    start: Date;
    end: Date;
}
