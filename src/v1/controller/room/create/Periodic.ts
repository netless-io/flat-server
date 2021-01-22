import { DocsType, PeriodicStatus, RoomStatus, RoomType, Week } from "../Constants";
import { Periodic, Docs } from "../Types";
import { Status } from "../../../../Constants";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { v4 } from "uuid";
import { differenceInCalendarDays, toDate } from "date-fns/fp";
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
import { calculatePeriodicDates, checkPeriodicTime } from "../utils/Periodic";

export const createPeriodic = async (
    req: PatchRequest<{
        Body: CreatePeriodicBody;
    }>,
): Response<CreatePeriodicResponse> => {
    const { title, type, beginTime, endTime, periodic, docs } = req.body;
    const { userUUID } = req.user;

    if (!checkPeriodicTime(beginTime, endTime)) {
        return {
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        };
    }

    // check periodic.endTime
    {
        if (periodic.endTime) {
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
        const dates = calculatePeriodicDates(beginTime, endTime, periodic);

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

            commands.push(RoomPeriodicDAO(t).insert(roomData));

            commands.push(
                RoomPeriodicConfigDAO(t).insert({
                    owner_uuid: userUUID,
                    periodic_status: PeriodicStatus.Idle,
                    title,
                    room_origin_begin_time: toDate(beginTime),
                    room_origin_end_time: toDate(endTime),
                    rate: periodic.rate || 0,
                    end_time: periodic.endTime
                        ? toDate(periodic.endTime)
                        : dates[dates.length - 1].start,
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

            // take the first lesson of the periodic room
            {
                commands.push(
                    RoomDAO(t).insert({
                        periodic_uuid: periodicUUID,
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

interface CreatePeriodicBody {
    title: string;
    type: RoomType;
    beginTime: number;
    endTime: number;
    periodic: Periodic;
    docs?: Docs[];
}

export const createPeriodicSchemaType: FastifySchema<{
    body: CreatePeriodicBody;
}> = {
    body: {
        type: "object",
        required: ["title", "type", "beginTime", "endTime", "periodic"],
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
                        minimum: 1,
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
                        required: ["endTime"],
                    },
                    {
                        required: ["rate"],
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

interface CreatePeriodicResponse {}
