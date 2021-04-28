import { compareDesc } from "date-fns/fp";
import {
    beginTimeLessEndTime,
    beginTimeExceedRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";

export const checkUpdateBeginAndEndTime = (
    beginTime: number,
    endTime: number,
    beforeTime: {
        begin_time: Date;
        end_time: Date;
    },
): boolean => {
    const isChangeBeginTime = compareDesc(beginTime, beforeTime.begin_time) !== 0;
    const isChangeEndTime = compareDesc(endTime, beforeTime.end_time) !== 0;

    if (isChangeBeginTime || isChangeEndTime) {
        if (
            beginTimeLessEndTime(beginTime, endTime) ||
            timeIntervalLessThanFifteenMinute(beginTime, endTime)
        ) {
            return false;
        }

        if (isChangeBeginTime && beginTimeExceedRedundancyOneMinute(beginTime)) {
            return false;
        }
    }

    return true;
};
