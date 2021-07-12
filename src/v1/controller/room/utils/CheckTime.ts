import { compareDesc, differenceInMilliseconds, subMinutes } from "date-fns/fp";

export const timeExceedRedundancyOneMinute = (time: number): boolean => {
    const redundancyTime = subMinutes(1)(Date.now());

    return compareDesc(time)(redundancyTime) === -1;
};

export const beginTimeLessEndTime = (beginTime: number, endTime: number): boolean => {
    // must endTime > beginTime
    // the end time cannot be less than the creation time
    return compareDesc(endTime)(beginTime) === -1;
};

const timeIntervalLessThanOrEqualMinute = (
    beginTime: number,
    endTime: number,
    minute: number,
): boolean => {
    return differenceInMilliseconds(beginTime, endTime) < minute;
};

export const timeIntervalLessThanFifteenMinute = (beginTime: number, endTime: number): boolean => {
    return timeIntervalLessThanOrEqualMinute(beginTime, endTime, 1000 * 60 * 15);
};

export const checkBeginAndEndTime = (beginTime: number, endTime: number): boolean => {
    if (timeExceedRedundancyOneMinute(beginTime)) {
        return false;
    }

    if (beginTimeLessEndTime(beginTime, endTime)) {
        return false;
    }

    // the interval between the start time and the end time must be greater than 15 minutes
    if (timeIntervalLessThanFifteenMinute(beginTime, endTime)) {
        return false;
    }

    return true;
};
