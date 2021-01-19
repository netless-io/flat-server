import { compareDesc, differenceInMilliseconds, subMinutes } from "date-fns/fp";

export const beginTimeLessRedundancyOneMinute = (beginTime: number): boolean => {
    // because network transmission will consume a little time, there is 1 minute redundancy
    const redundancyTime = subMinutes(Date.now(), 1);

    // beginTime >= redundancyTime
    // creation room time cannot be less than current time
    return compareDesc(beginTime)(redundancyTime) === -1;
};

export const beginTimeLessEndTime = (beginTime: number, endTime: number): boolean => {
    // endTime < beginTime
    // the end time cannot be less than the creation time
    return compareDesc(endTime)(beginTime) === -1;
};

const timeIntervalLessMinute = (beginTime: number, endTime: number, minute: number): boolean => {
    return differenceInMilliseconds(beginTime, endTime) < minute;
};

export const timeIntervalLessFifteenMinute = (beginTime: number, endTime: number): boolean => {
    return timeIntervalLessMinute(beginTime, endTime, 1000 * 60 * 15);
};
