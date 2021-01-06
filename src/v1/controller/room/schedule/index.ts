import { DocsType, RoomStatus, RoomType, Week } from "../Constants";
import { Periodic, Docs } from "../Types";
import { Status } from "../../../../Constants";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { RoomModel } from "../../../model/room/Room";
import { v4 } from "uuid";
import { compareDesc, differenceInMilliseconds, subMinutes, toDate } from "date-fns/fp";
import { dateIntervalByRate, dateIntervalByWeek, DateIntervalResult } from "../utils/DateInterval";
import { RoomDocModel } from "../../../model/room/RoomDoc";
import { getConnection } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { RoomPeriodicModel } from "../../../model/room/RoomPeriodic";
import cryptoRandomString from "crypto-random-string";
import { whiteboardCreateRoom } from "../../../utils/Whiteboard";
import { RoomPeriodicUserModel } from "../../../model/room/RoomPeriodicUser";

export const schedule = async (
    req: PatchRequest<{
        Body: ScheduleBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { title, type, beginTime, endTime, periodic, docs } = req.body;
    const { userUUID } = req.user;

    // check beginTime and endTime
    {
        // Because network transmission will consume a little time, there is 1 minute redundancy
        const redundancyTime = subMinutes(Date.now(), 1);
        // beginTime >= redundancyTime
        if (compareDesc(beginTime)(redundancyTime) === -1) {
            return reply.send({
                status: Status.Failed,
                message: "Creation room time cannot be less than current time",
            });
        }

        const result = compareDesc(endTime)(beginTime);
        // endTime < beginTime
        if (result === -1) {
            return reply.send({
                status: Status.Failed,
                message: "The end time cannot be less than the creation time",
            });
        }

        // endTime - beginTime < 15m
        if (differenceInMilliseconds(beginTime, endTime) < 1000 * 60 * 15) {
            return reply.send({
                status: Status.Failed,
                message:
                    "The interval between the start time and the end time must be greater than 15 minutes",
            });
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
            dates = dateIntervalByWeek({
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
                room_type: type,
                room_status: RoomStatus.Pending,
                begin_time: start,
                end_time: end,
            };
        });

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            if (typeof periodic !== "undefined") {
                commands.push(t.insert(RoomPeriodicModel, roomData));

                commands.push(
                    t.insert(RoomPeriodicConfigModel, {
                        owner_uuid: userUUID,
                        periodic_status: RoomStatus.Pending,
                        title,
                        rate: periodic.rate || 0,
                        end_time: periodic.endTime || "0",
                        periodic_uuid: periodicUUID,
                    }),
                );

                commands.push(
                    t.insert(RoomPeriodicUserModel, {
                        periodic_uuid: periodicUUID,
                        user_uuid: userUUID,
                    }),
                );
            }

            // take the first lesson of the periodic room
            {
                commands.push(
                    t.insert(RoomModel, {
                        periodic_uuid: typeof periodic !== "undefined" ? periodicUUID : "",
                        owner_uuid: userUUID,
                        title,
                        room_type: type,
                        room_status: RoomStatus.Pending,
                        room_uuid: roomData[0].fake_room_uuid,
                        whiteboard_room_uuid: await whiteboardCreateRoom(title),
                        begin_time: roomData[0].begin_time,
                        end_time: roomData[0].end_time,
                    }),
                );

                commands.push(
                    t.insert(RoomUserModel, {
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
                commands.push(t.insert(RoomDocModel, roomDocData));
            }

            await Promise.all(commands);
        });

        return reply.send({
            status: Status.Success,
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "Failed to schedule room",
        });
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
