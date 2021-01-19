import { DocsType, PeriodicStatus, RoomStatus, RoomType, Week } from "../Constants";
import { Periodic, Docs } from "../Types";
import { Status } from "../../../../Constants";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { v4 } from "uuid";
import { differenceInCalendarDays, toDate } from "date-fns/fp";
import {
    dateIntervalByRate,
    dateIntervalByEndTime,
    DateIntervalResult,
} from "../utils/DateInterval";
import { getConnection } from "typeorm";
import cryptoRandomString from "crypto-random-string";
import { whiteboardCreateRoom } from "../../../utils/request/whiteboard/Whiteboard";
import { ErrorCode } from "../../../../ErrorCode";
import {
    RoomDAO,
    RoomDocDAO,
    RoomPeriodicConfigDAO,
    RoomPeriodicDAO,
    RoomPeriodicUserDAO,
    RoomUserDAO,
} from "../../../dao";
import {
    beginTimeLessEndTime,
    beginTimeLessRedundancyOneMinute,
    timeIntervalLessFifteenMinute,
} from "../utils/CheckTime";

export const schedule = async (
    req: PatchRequest<{
        Body: ScheduleBody;
    }>,
): Response<ScheduleResponse> => {
    const { title, type, beginTime, endTime, periodic, docs } = req.body;
    const { userUUID } = req.user;

    // check beginTime and endTime
    {
        if (beginTimeLessRedundancyOneMinute(beginTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        if (beginTimeLessEndTime(beginTime, endTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        // the interval between the start time and the end time must be greater than 15 minutes
        if (timeIntervalLessFifteenMinute(beginTime, endTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }
    }

    // check periodic.endTime
    {
        if (periodic?.endTime) {
            // endTime(day) > periodic.endTime(day)
            if (differenceInCalendarDays(endTime)(periodic.endTime) < 0) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                };
            }
        }
    }

    try {
        const beginDateTime = toDate(beginTime);
        const endDateTime = toDate(endTime);

        let dates: DateIntervalResult[];

        if (typeof periodic === "undefined") {
            dates = [
                {
                    start: beginDateTime,
                    end: endDateTime,
                },
            ];
        } else if (typeof periodic.rate === "number") {
            dates = dateIntervalByRate({
                start: beginDateTime,
                end: endDateTime,
                rate: periodic.rate,
                weeks: periodic.weeks,
            });
        } else {
            dates = dateIntervalByEndTime({
                start: beginDateTime,
                end: endDateTime,
                endDate: toDate(periodic.endTime as number),
                weeks: periodic.weeks,
            });
        }

        const periodicUUID = v4();

        const roomData = dates.map(({ start, end }) => {
            return {
                periodic_uuid: periodicUUID,
                fake_room_uuid: v4(),
                room_status: RoomStatus.Idle,
                begin_time: start,
                end_time: end,
            };
        });

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            if (typeof periodic !== "undefined") {
                commands.push(RoomPeriodicDAO(t).insert(roomData));

                commands.push(
                    RoomPeriodicConfigDAO(t).insert({
                        owner_uuid: userUUID,
                        periodic_status: PeriodicStatus.Idle,
                        title,
                        rate: periodic.rate || 0,
                        end_time: periodic.endTime
                            ? toDate(periodic.endTime)
                            : dates[dates.length - 1].end,
                        room_type: type,
                        periodic_uuid: periodicUUID,
                    }),
                );

                commands.push(
                    RoomPeriodicUserDAO(t).insert({
                        periodic_uuid: periodicUUID,
                        user_uuid: userUUID,
                    }),
                );
            }

            // take the first lesson of the periodic room
            {
                commands.push(
                    RoomDAO(t).insert({
                        periodic_uuid: typeof periodic !== "undefined" ? periodicUUID : "",
                        owner_uuid: userUUID,
                        title,
                        room_type: type,
                        room_status: RoomStatus.Idle,
                        room_uuid: roomData[0].fake_room_uuid,
                        whiteboard_room_uuid: await whiteboardCreateRoom(title),
                        begin_time: roomData[0].begin_time,
                        end_time: roomData[0].end_time,
                    }),
                );

                commands.push(
                    RoomUserDAO(t).insert({
                        room_uuid: roomData[0].fake_room_uuid,
                        user_uuid: userUUID,
                        rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
                    }),
                );
            }

            if (docs) {
                const roomDocData = docs.map(({ uuid, type }) => {
                    return {
                        doc_uuid: uuid,
                        room_uuid: "",
                        periodic_uuid: periodicUUID,
                        doc_type: type,
                        is_preload: true,
                    };
                });
                commands.push(RoomDocDAO(t).insert(roomDocData));
            }

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {},
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface ScheduleBody {
    title: string;
    type: RoomType;
    beginTime: number;
    endTime: number;
    periodic?: Periodic;
    docs?: Docs[];
}

export const scheduleSchemaType: FastifySchema<{
    body: ScheduleBody;
}> = {
    body: {
        type: "object",
        required: ["title", "type", "beginTime", "endTime"],
        properties: {
            title: {
                type: "string",
                maxLength: 50,
            },
            type: {
                type: "string",
                eq: [RoomType.OneToOne, RoomType.SmallClass, RoomType.BigClass],
            },
            beginTime: {
                type: "integer",
                format: "unix-timestamp",
            },
            endTime: {
                type: "integer",
                format: "unix-timestamp",
            },
            periodic: {
                type: "object",
                required: ["weeks"],
                nullable: true,
                properties: {
                    weeks: {
                        type: "array",
                        uniqueItems: true,
                        items: {
                            type: "integer",
                            enum: [
                                Week.Monday,
                                Week.Tuesday,
                                Week.Wednesday,
                                Week.Thursday,
                                Week.Friday,
                                Week.Saturday,
                                Week.Sunday,
                            ],
                        },
                        maxItems: 7,
                        minItems: 1,
                    },
                    rate: {
                        type: "integer",
                        maximum: 50,
                        minimum: -1,
                        nullable: true,
                    },
                    endTime: {
                        type: "integer",
                        format: "unix-timestamp",
                        nullable: true,
                    },
                },
                oneOf: [
                    {
                        required: ["weeks", "endTime"],
                    },
                    {
                        required: ["weeks", "rate"],
                    },
                ],
            },
            docs: {
                type: "array",
                nullable: true,
                items: {
                    type: "object",
                    required: ["type", "uuid"],
                    properties: {
                        type: {
                            type: "string",
                            enum: [DocsType.Dynamic, DocsType.Static],
                        },
                        uuid: {
                            type: "string",
                        },
                    },
                },
                maxItems: 10,
            },
        },
    },
};

interface ScheduleResponse {}
