import { DocsType, RoomStatus, RoomType, Week } from "../Constants";
import { Cyclical, Docs } from "../Types";
import { Status } from "../../../../Constants";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { RoomModel } from "../../../model/room/Room";
import { v4 } from "uuid";
import { UTCDate } from "../../../../utils/Time";
import { compareDesc, differenceInMilliseconds, subMinutes, toDate } from "date-fns/fp";
import { dateIntervalByRate, dateIntervalByWeek, DateIntervalResult } from "../utils/DateInterval";
import { RoomDocModel } from "../../../model/room/RoomDoc";
import { getConnection } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { RoomCyclicalConfigModel } from "../../../model/room/RoomCyclicalConfig";
import { RoomCyclicalModel } from "../../../model/room/RoomCyclical";
import cryptoRandomString from "crypto-random-string";
import { whiteboardCreateRoom } from "../../../utils/Whiteboard";

export const schedule = async (
    req: PatchRequest<{
        Body: ScheduleBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { title, type, beginTime, endTime, cyclical, docs } = req.body;
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
        const beginDateTime = UTCDate(beginTime);
        const endDateTime = UTCDate(endTime);

        let dates: DateIntervalResult[];

        if (typeof cyclical.rate === "number") {
            dates = dateIntervalByRate({
                start: beginDateTime,
                end: endDateTime,
                rate: cyclical.rate,
                weeks: cyclical.weeks,
            });
        } else {
            dates = dateIntervalByWeek({
                start: beginDateTime,
                end: endDateTime,
                endDate: toDate(cyclical.endTime as number),
                weeks: cyclical.weeks,
            });
        }

        const cyclicalUUID = v4();

        const roomCyclicalData = dates.map(({ start, end }) => {
            return {
                cyclical_uuid: cyclicalUUID,
                fake_room_uuid: v4(),
                room_type: type,
                begin_time: start,
                end_time: end,
            };
        });

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(t.insert(RoomCyclicalModel, roomCyclicalData));

            // take the first lesson of the cyclical room
            {
                commands.push(
                    t.insert(RoomCyclicalConfigModel, {
                        creator_user_uuid: userUUID,
                        title,
                        rate: cyclical.rate || 0,
                        end_time: cyclical.endTime ? UTCDate(cyclical.endTime) : "0",
                        cyclical_uuid: cyclicalUUID,
                    }),
                );

                commands.push(
                    t.insert(RoomModel, {
                        cyclical_uuid: cyclicalUUID,
                        creator_user_uuid: userUUID,
                        title,
                        room_type: type,
                        room_status: RoomStatus.Pending,
                        room_uuid: roomCyclicalData[0].fake_room_uuid,
                        whiteboard_room_uuid: await whiteboardCreateRoom(title),
                        begin_time: roomCyclicalData[0].begin_time,
                        end_time: roomCyclicalData[0].end_time,
                    }),
                );

                commands.push(
                    t.insert(RoomUserModel, {
                        room_uuid: roomCyclicalData[0].fake_room_uuid,
                        user_uuid: userUUID,
                        user_int_uuid: cryptoRandomString({ length: 10, type: "numeric" }),
                    }),
                );
            }

            if (docs) {
                const roomDocData = docs.map(({ uuid, type }) => {
                    return {
                        doc_uuid: uuid,
                        room_uuid: "",
                        cyclical_uuid: cyclicalUUID,
                        doc_type: type,
                        is_preload: false,
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

type ScheduleBody = {
    title: string;
    type: RoomType;
    beginTime: number;
    endTime: number;
    cyclical: Cyclical;
    docs?: Docs[];
};

export const scheduleSchemaType: FastifySchema<{
    body: ScheduleBody;
}> = {
    body: {
        type: "object",
        required: ["title", "type", "beginTime", "endTime", "cyclical"],
        properties: {
            title: {
                type: "string",
                maxLength: 50,
            },
            type: {
                type: "integer",
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
            cyclical: {
                type: "object",
                required: ["weeks"],
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
