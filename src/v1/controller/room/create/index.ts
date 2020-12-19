import { DocsType, RoomStatus, RoomType, Week } from "../Constants";
import { Cyclical, Docs } from "../Types";
import { Status } from "../../../../Constants";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { sequelize } from "../../../service/SequelizeService";
import { RoomModel } from "../../../model/room/Room";
import { v4 } from "uuid";
import { timestampFormat } from "../../../../utils/Time";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { compareDesc, subMinutes, toDate } from "date-fns/fp";
import { dateIntervalByRate, dateIntervalByWeek, DateIntervalResult } from "../utils/DateInterval";
import { RoomCyclicalModel } from "../../../model/room/RoomCyclical";
import { RoomDocModel } from "../../../model/room/RoomDoc";

export const create = async (
    req: PatchRequest<{
        Body: CreateBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { title, type, beginTime, endTime, cyclical, docs } = req.body;

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

        // endTime >= beginTime
        if (compareDesc(endTime)(beginTime) === -1) {
            return reply.send({
                status: Status.Failed,
                message: "The end time cannot be less than the creation time",
            });
        }
    }

    try {
        const beginDateTime = toDate(beginTime);
        const endDateTime = toDate(endTime);

        let dates: DateIntervalResult[];

        if (typeof cyclical === "undefined") {
            dates = [
                {
                    start: beginDateTime,
                    end: endDateTime,
                },
            ];
        } else if (typeof cyclical.rate === "number") {
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

        const timestamp = timestampFormat();
        const cyclicalUUID = cyclical ? v4() : "";

        const baseDate = {
            created_at: timestamp,
            updated_at: timestamp,
            version: 0,
            is_delete: false,
        };

        const roomData = dates.map(({ start, end }) => {
            return {
                ...baseDate,
                cyclical_uuid: cyclicalUUID,
                creator_user_uuid: req.user.userUUID,
                title,
                room_type: type,
                room_status: RoomStatus.Pending,
                room_uuid: v4(),
                begin_time: start.getTime(),
                end_time: end.getTime(),
            };
        });

        const roomUserData = roomData.map(({ room_uuid }) => {
            return {
                ...baseDate,
                room_uuid,
                user_uuid: req.user.userUUID,
            };
        });

        await sequelize.transaction(async t => {
            const commands: Promise<any>[] = [];

            commands.push(RoomModel.bulkCreate(roomData, { transaction: t }));

            commands.push(RoomUserModel.bulkCreate(roomUserData, { transaction: t }));

            if (cyclical) {
                commands.push(
                    RoomCyclicalModel.create(
                        {
                            ...baseDate,
                            creator_user_uuid: req.user.userUUID,
                            rate: cyclical.rate || 0,
                            end_time: cyclical.endTime ? timestampFormat(cyclical.endTime) : "0",
                            cyclical_uuid: cyclicalUUID,
                        },
                        {
                            transaction: t,
                        },
                    ),
                );
            }

            if (docs) {
                const roomDocData = docs.map(({ uuid, type }) => {
                    return {
                        ...baseDate,
                        doc_uuid: uuid,
                        room_uuid: cyclical ? "" : roomData[0].room_uuid,
                        cyclical_uuid: cyclicalUUID,
                        doc_type: type,
                        is_preload: false,
                    };
                });
                commands.push(RoomDocModel.bulkCreate(roomDocData, { transaction: t }));
            }

            await Promise.all(commands);

            reply.send({
                status: Status.Success,
            });
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "Failed to create room",
        });
    }
};

type CreateBody = {
    title: string;
    type: RoomType;
    beginTime: number;
    endTime: number;
    cyclical?: Cyclical;
    docs?: Docs[];
};

export const createSchemaType: FastifySchema<{
    body: CreateBody;
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
