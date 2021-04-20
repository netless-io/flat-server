import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { RoomDocModel } from "../../../model/room/RoomDoc";
import { Docs } from "../Types";
import { compareDesc } from "date-fns/fp";
import {
    beginTimeLessEndTime,
    beginTimeLessRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";

export const docsDiff = (
    roomDocs: Pick<RoomDocModel, "doc_uuid">[],
    docs: Docs[],
    insertPayload: Pick<RoomDocModel, "room_uuid"> | Pick<RoomDocModel, "periodic_uuid">,
): {
    willRemoveDocs: string[];
    willAddDocs: QueryDeepPartialEntity<RoomDocModel>[];
} => {
    const paramsDocs = docs || [];
    const docsUUIDInDB = roomDocs.map(doc => doc.doc_uuid);
    const docsUUIDInParams = paramsDocs.map(doc => doc.uuid);

    // roomDocs = [1, 2, 3, 4]
    // docsUUIDInParams = [1, 2]
    // => [3, 4]
    const willRemoveDocs = docsUUIDInDB.filter(uuid => {
        return !docsUUIDInParams.includes(uuid);
    });

    // docs = [1, 2, 3, 4]
    // docsUUIDInDB = [1,2]
    // => [3, 4]
    const willAddDocs: QueryDeepPartialEntity<RoomDocModel>[] = (() => {
        const result: QueryDeepPartialEntity<RoomDocModel>[] = [];

        paramsDocs.forEach(({ uuid, type }) => {
            if (!docsUUIDInDB.includes(uuid)) {
                result.push({
                    doc_type: type,
                    doc_uuid: uuid,
                    periodic_uuid: "",
                    room_uuid: "",
                    is_preload: false,
                    ...insertPayload,
                });
            }
        });

        return result;
    })();

    return {
        willRemoveDocs,
        willAddDocs,
    };
};

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

        if (isChangeBeginTime && beginTimeLessRedundancyOneMinute(beginTime)) {
            return false;
        }
    }

    return true;
};
