import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import {
    RoomDAO,
    RoomDocDAO,
    RoomPeriodicConfigDAO,
    RoomPeriodicDAO,
    RoomUserDAO,
} from "../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../Constants";
import { DocsType, RoomStatus, RoomType, Week } from "../Constants";
import { getConnection, In } from "typeorm";
import { Docs, Periodic } from "../Types";
import { checkUpdateBeginAndEndTime, docsDiff } from "./Utils";
import { compareDesc, differenceInCalendarDays } from "date-fns/fp";
import { v4 } from "uuid";
import { calculatePeriodicDates } from "../utils/Periodic";
import {
    whiteboardBanRoom,
    whiteboardCreateRoom,
} from "../../../utils/request/whiteboard/Whiteboard";

export const updatePeriodic = async (
    req: PatchRequest<{
        Body: UpdatePeriodicBody;
    }>,
): Response<UpdatePeriodicResponse> => {
    const { periodicUUID, beginTime, endTime, title, type, periodic, docs } = req.body;
    const { userUUID } = req.user;

    const periodicConfigInfo = await RoomPeriodicConfigDAO().findOne(
        ["room_origin_begin_time", "room_origin_end_time", "end_time", "rate"],
        {
            periodic_uuid: periodicUUID,
            owner_uuid: userUUID,
        },
    );

    if (periodicConfigInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.PeriodicNotFound,
        };
    }

    const { room_origin_begin_time, room_origin_end_time, end_time, rate } = periodicConfigInfo;

    if (
        !checkUpdateBeginAndEndTime(beginTime, endTime, {
            begin_time: room_origin_begin_time,
            end_time: room_origin_end_time,
        })
    ) {
        return {
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        };
    }

    if (periodic.endTime) {
        // it was rate before, or periodic.endTime was modified
        if (rate !== 0 || compareDesc(end_time, periodic.endTime) !== 0) {
            // endTime(day) > periodic.endTime(day)
            if (differenceInCalendarDays(endTime)(periodic.endTime) < 0) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                };
            }
        }
    }

    const hasRunningSubRoom = await RoomPeriodicDAO().findOne(["id"], {
        periodic_uuid: periodicUUID,
        room_status: In([RoomStatus.Started, RoomStatus.Paused]),
    });

    // if the sub room is running, it is not allowed to modify
    if (hasRunningSubRoom) {
        return {
            status: Status.Failed,
            code: ErrorCode.PeriodicSubRoomHasRunning,
        };
    }

    const roomInfo = await RoomDAO().findOne(["room_uuid", "whiteboard_room_uuid"], {
        periodic_uuid: periodicUUID,
        room_status: RoomStatus.Idle,
    });

    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotFound,
        };
    }

    const dates = calculatePeriodicDates(beginTime, endTime, periodic);

    const willAddRoom = dates.map(({ start, end }) => {
        return {
            periodic_uuid: periodicUUID,
            fake_room_uuid: v4(),
            room_status: RoomStatus.Idle,
            begin_time: start,
            end_time: end,
        };
    });

    const willRemoveRoom = (
        await RoomPeriodicDAO().find(["id"], {
            periodic_uuid: periodicUUID,
            room_status: RoomStatus.Idle,
        })
    ).map(room => room.id);

    const roomDocs = await RoomDocDAO().find(["doc_uuid"], {
        periodic_uuid: periodicUUID,
    });

    const { willAddDocs, willRemoveDocs } = docsDiff(roomDocs, docs, {
        periodic_uuid: periodicUUID,
    });

    try {
        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomPeriodicConfigDAO(t).update(
                    {
                        room_origin_begin_time: beginTime,
                        room_origin_end_time: endTime,
                        end_time: periodic.endTime || end_time,
                        rate: periodic.rate || rate,
                        title,
                        room_type: type,
                    },
                    {
                        periodic_uuid: periodicUUID,
                    },
                ),
            );

            commands.push(
                RoomPeriodicDAO(t).insert(willAddRoom),
                RoomPeriodicDAO(t).remove({
                    id: In(willRemoveRoom),
                }),
            );

            commands.push(
                RoomDocDAO(t).insert(willAddDocs),
                RoomDocDAO(t).remove({
                    periodic_uuid: periodicUUID,
                    doc_uuid: In(willRemoveDocs),
                }),
            );

            commands.push(
                RoomDAO(t).remove({
                    room_uuid: roomInfo.room_uuid,
                }),
                RoomDAO(t).insert({
                    periodic_uuid: periodicUUID,
                    owner_uuid: userUUID,
                    title,
                    room_type: type,
                    room_status: RoomStatus.Idle,
                    room_uuid: willAddRoom[0].fake_room_uuid,
                    whiteboard_room_uuid: await whiteboardCreateRoom(title),
                    begin_time: willAddRoom[0].begin_time,
                    end_time: willAddRoom[0].end_time,
                }),
            );

            commands.push(
                RoomUserDAO(t).update(
                    {
                        room_uuid: willAddRoom[0].fake_room_uuid,
                    },
                    {
                        room_uuid: roomInfo.room_uuid,
                    },
                ),
            );

            await Promise.all(commands);
            await whiteboardBanRoom(roomInfo.whiteboard_room_uuid);
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

interface UpdatePeriodicBody {
    periodicUUID: string;
    beginTime: number;
    endTime: number;
    title: string;
    type: RoomType;
    periodic: Periodic;
    docs: Docs[];
}

export const updatePeriodicSchemaType: FastifySchema<{
    body: UpdatePeriodicBody;
}> = {
    body: {
        type: "object",
        required: ["periodicUUID", "beginTime", "endTime", "title", "type", "docs"],
        properties: {
            periodicUUID: {
                type: "string",
                format: "uuid-v4",
            },
            beginTime: {
                type: "number",
                format: "unix-timestamp",
            },
            endTime: {
                type: "number",
                format: "unix-timestamp",
            },
            title: {
                type: "string",
            },
            type: {
                type: "string",
                enum: [RoomType.SmallClass, RoomType.BigClass, RoomType.OneToOne],
                maxLength: 50,
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

interface UpdatePeriodicResponse {}
