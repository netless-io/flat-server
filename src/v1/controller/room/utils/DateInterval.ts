import { Week } from "../Constants";
import {
    add,
    addDays,
    addMilliseconds,
    compareDesc,
    differenceInMilliseconds,
    eachDayOfInterval,
    getDay,
    getHours,
    getMilliseconds,
    getMinutes,
    getSeconds,
    toDate,
} from "date-fns/fp";

/**
 * calculate all the days in two dates that meet certain days of the week
 *
 * @param {Date} start - start time
 * @param {Date} end - end time
 * @param {Date} endDate - stop the time
 * @param {Week[]} weeks - array of weeks to match
 * @returns {DateIntervalResult[]} matching array
 *
 * @example
 * const start = toDate(1608195990399);
 * const end = addMinutes(45)(start);
 * const endDate = addDays(15)(start);
 * const weeks = [0, 2, 6];
 * const result = dateIntervalByWeek({
 *     start,
 *     end,
 *     endDate,
 *     weeks,
 * });
 * //=> [
 *     { start: 2020-12-19T09:06:30.399Z, end: 2020-12-19T09:51:30.399Z },
 *     { start: 2020-12-20T09:06:30.399Z, end: 2020-12-20T09:51:30.399Z },
 *     { start: 2020-12-22T09:06:30.399Z, end: 2020-12-22T09:51:30.399Z },
 *     { start: 2020-12-26T09:06:30.399Z, end: 2020-12-26T09:51:30.399Z },
 *     { start: 2020-12-27T09:06:30.399Z, end: 2020-12-27T09:51:30.399Z },
 *     { start: 2020-12-29T09:06:30.399Z, end: 2020-12-29T09:51:30.399Z }
 * ]
 */
export const dateIntervalByEndTime = ({
    start,
    end,
    endDate,
    weeks,
}: DateIntervalByWeekParams): DateIntervalResult[] => {
    {
        const result = compareDesc(endDate)(start);
        if (result === -1) {
            throw new Error(
                "The periodic end time cannot be less than the creation room begin time",
            );
        }

        if (result === 0) {
            return [
                {
                    start: toDate(start),
                    end: toDate(end),
                },
            ];
        }
    }

    // because eachDayOfInterval will lose hours / minutes / seconds / ms
    // so here first extract the relevant information
    const completionTimeInfo = {
        hours: getHours(start),
        minutes: getMinutes(start),
        seconds: getSeconds(start),
        milliseconds: getMilliseconds(start),
    };

    const duration = differenceInMilliseconds(start)(end);

    const allDays = eachDayOfInterval({
        start,
        end: endDate,
    });

    const result: DateIntervalResult[] = [];

    for (let i = 0; i < allDays.length; i++) {
        const date = allDays[i];
        if (weeks.includes(getDay(date))) {
            // e.g: 2020-12-29T16:00:00.000Z -> 2020-12-29T${16 + hours}:${00 + minutes}:${00 + seconds}.${000 + milliseconds}Z
            // link: https://date-fns.org/v2.16.1/docs/fp/addMilliseconds
            // link: https://date-fns.org/v2.16.1/docs/fp/add
            const start = addMilliseconds(completionTimeInfo.milliseconds)(
                add(completionTimeInfo)(date),
            );

            result.push({
                start: start,
                // end = start + (params.end - params.start)
                end: addMilliseconds(duration)(start),
            });
        }
    }

    return result;
};

/**
 * from the start time until the number of times is met, all dates during the period
 *
 * @param {Date} start - start time
 * @param {Date} end - end time
 * @param {number} rate - repeat times
 * @param {Week[]} weeks - array of weeks to match
 * @returns {DateIntervalResult[]} matching array
 *
 * @example
 * const start = toDate(1608195990399);
 * const end = addMinutes(45)(start);
 * const rate = 6;
 * const weeks = [0, 2, 6];
 * const result = dateIntervalByWeek({
 *     start,
 *     end,
 *     rate,
 *     weeks,
 * });
 * //=> [
 *     { start: 2020-12-19T09:06:30.399Z, end: 2020-12-19T09:51:30.399Z },
 *     { start: 2020-12-20T09:06:30.399Z, end: 2020-12-20T09:51:30.399Z },
 *     { start: 2020-12-22T09:06:30.399Z, end: 2020-12-22T09:51:30.399Z },
 *     { start: 2020-12-26T09:06:30.399Z, end: 2020-12-26T09:51:30.399Z },
 *     { start: 2020-12-27T09:06:30.399Z, end: 2020-12-27T09:51:30.399Z },
 *     { start: 2020-12-29T09:06:30.399Z, end: 2020-12-29T09:51:30.399Z }
 * ]
 */
export const dateIntervalByRate = ({
    start,
    end,
    rate,
    weeks,
}: DateIntervalByRateParams): DateIntervalResult[] => {
    const completionTimeInfo = {
        hours: getHours(start),
        minutes: getMinutes(start),
        seconds: getSeconds(start),
        milliseconds: getMilliseconds(start),
    };

    const duration = differenceInMilliseconds(start)(end);

    const allDays = eachDayOfInterval({
        start,
        end: addDays(rate * 7 + 6)(start),
    });

    const result: DateIntervalResult[] = [];
    for (let i = 0; i < allDays.length; i++) {
        const date = allDays[i];

        if (weeks.includes(getDay(date))) {
            const start = addMilliseconds(completionTimeInfo.milliseconds)(
                add(completionTimeInfo)(date),
            );

            result.push({
                start,
                // end = start + (params.end - params.start)
                end: addMilliseconds(duration)(start),
            });

            if (result.length === rate) {
                return result;
            }
        }
    }

    // never come here, this return just prevents ts from reporting errors
    return result;
};

interface DateIntervalByWeekParams {
    start: number | Date;
    end: number | Date;
    endDate: number | Date;
    weeks: Week[];
}

interface DateIntervalByRateParams {
    start: number | Date;
    end: number | Date;
    rate: number;
    weeks: Week[];
}

export interface DateIntervalResult {
    start: Date;
    end: Date;
}
