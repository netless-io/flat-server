import test from "ava";
import { addMinutes, addSeconds, subMinutes } from "date-fns/fp";
import {
    beginTimeGreaterThanEndTime,
    checkBeginAndEndTime,
    timeExceedRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../CheckTime";

const namespace = "[utils][utils-room][utils-room-time]";

test(`${namespace} - time less redundancy one minute`, ava => {
    const beginTime = subMinutes(3)(Date.now());
    const result = timeExceedRedundancyOneMinute(+beginTime);

    ava.true(result);
});

test(`${namespace} - beginTime less endTime`, ava => {
    const beginTime = Date.now();
    const result = beginTimeGreaterThanEndTime(+beginTime, +addMinutes(1)(beginTime));

    ava.false(result);
});

test(`${namespace} - time interval less than fifteen minute`, ava => {
    const now = Date.now();
    const result = timeIntervalLessThanFifteenMinute(now, +addMinutes(15)(now));

    ava.false(result);
});

test(`${namespace} - check begin and endTime`, ava => {
    {
        const beginTime = subMinutes(2)(Date.now());
        const result = checkBeginAndEndTime(+beginTime, Date.now());

        ava.false(result);
    }

    {
        const beginTime = Date.now();
        const result = checkBeginAndEndTime(+addSeconds(1)(beginTime), beginTime);

        ava.false(result);
    }

    {
        const now = Date.now();
        const result = checkBeginAndEndTime(now, +addMinutes(14)(now));

        ava.false(result);
    }

    {
        const now = Date.now();
        const result = checkBeginAndEndTime(now, +addMinutes(16)(now));

        ava.true(result);
    }
});
