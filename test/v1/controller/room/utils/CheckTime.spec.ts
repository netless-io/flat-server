import { addMinutes, addSeconds, subMinutes } from "date-fns/fp";
import {
    beginTimeLessEndTime,
    timeExceedRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
    checkBeginAndEndTime,
} from "../../../../../src/v1/controller/room/utils/CheckTime";
import { describe } from "mocha";
import { expect } from "chai";

describe("V1 Controller Room CheckTime Utils", () => {
    it("time less redundancy one minute", () => {
        const beginTime = subMinutes(3)(Date.now());
        const result = timeExceedRedundancyOneMinute(+beginTime);

        expect(result).to.true;
    });

    it("beginTime less endTime", () => {
        const beginTime = Date.now();
        const result = beginTimeLessEndTime(+beginTime, +addMinutes(1)(beginTime));

        expect(result).to.false;
    });

    it("time interval less than fifteen minute", () => {
        const now = Date.now();
        const result = timeIntervalLessThanFifteenMinute(now, +addMinutes(15)(now));

        expect(result).to.false;
    });

    it("check begin and endTime", () => {
        {
            const beginTime = subMinutes(2)(Date.now());
            const result = checkBeginAndEndTime(+beginTime, Date.now());

            expect(result).to.false;
        }

        {
            const beginTime = Date.now();
            const result = checkBeginAndEndTime(+addSeconds(1)(beginTime), beginTime);

            expect(result).to.false;
        }

        {
            const now = Date.now();
            const result = checkBeginAndEndTime(now, +addMinutes(14)(now));

            expect(result).to.false;
        }

        {
            const now = Date.now();
            const result = checkBeginAndEndTime(now, +addMinutes(16)(now));

            expect(result).to.true;
        }
    });
});
