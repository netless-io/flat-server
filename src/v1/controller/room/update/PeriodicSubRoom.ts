import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../Constants";
import { RoomStatus } from "../Constants";
import { getConnection, LessThan, MoreThan } from "typeorm";
import { compareDesc, toDate } from "date-fns/fp";
import {
    beginTimeLessEndTime,
    beginTimeExceedRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";

export const updatePeriodicSubRoom = async (
    req: PatchRequest<{
        Body: UpdatePeriodicSubRoomBody;
    }>,
): Response<UpdatePeriodicSubRoomResponse> => {
    const { periodicUUID, roomUUID, beginTime, endTime } = req.body;
    const { userUUID } = req.user;

    const periodicRoomConfig = await RoomPeriodicConfigDAO().findOne(["id"], {
        periodic_uuid: periodicUUID,
        owner_uuid: userUUID,
    });

    if (periodicRoomConfig === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.PeriodicNotFound,
        };
    }

    const periodicRoomInfo = await RoomPeriodicDAO().findOne(
        ["begin_time", "end_time", "room_status"],
        {
            periodic_uuid: periodicUUID,
            fake_room_uuid: roomUUID,
        },
    );

    if (periodicRoomInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotFound,
        };
    }

    if (periodicRoomInfo.room_status !== RoomStatus.Idle) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotIsIdle,
        };
    }

    const isChangeBeginTime = compareDesc(beginTime, periodicRoomInfo.begin_time) !== 0;
    const isChangeEndTime = compareDesc(endTime, periodicRoomInfo.end_time) !== 0;

    // legality of detection time
    {
        if (isChangeBeginTime || isChangeEndTime) {
            if (beginTimeLessEndTime(beginTime, endTime)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                };
            }

            if (timeIntervalLessThanFifteenMinute(beginTime, endTime)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                };
            }
        }
    }

    // the modified begin time cannot be earlier than the begin time of the previous room
    if (isChangeBeginTime) {
        const previousPeriodicRoom = await RoomPeriodicDAO().findOne(
            ["begin_time"],
            {
                periodic_uuid: periodicUUID,
                begin_time: LessThan(periodicRoomInfo.begin_time),
            },
            ["begin_time", "DESC"],
        );

        if (previousPeriodicRoom !== undefined) {
            // beginTime <= previousPeriodicRoom.begin_time
            if (compareDesc(beginTime, previousPeriodicRoom.begin_time) !== 1) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                };
            }
        } else {
            // if it is the first room, it must be later than the current time
            if (beginTimeExceedRedundancyOneMinute(beginTime)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                };
            }
        }
    }

    // the modified end time must be later than the end time of the next room
    if (isChangeEndTime) {
        const nextPeriodicRoom = await RoomPeriodicDAO().findOne(
            ["end_time"],
            {
                periodic_uuid: periodicUUID,
                begin_time: MoreThan(periodicRoomInfo.begin_time),
            },
            ["begin_time", "ASC"],
        );

        if (
            nextPeriodicRoom !== undefined &&
            // nextPeriodicRoom.end_time <= endTime
            compareDesc(nextPeriodicRoom.end_time, endTime) !== 1
        ) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }
    }

    try {
        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            const begin_time = toDate(beginTime);
            const end_time = toDate(endTime);

            commands.push(
                RoomPeriodicDAO(t).update(
                    {
                        begin_time,
                        end_time,
                    },
                    {
                        fake_room_uuid: roomUUID,
                    },
                ),
            );

            const roomInfo = await RoomDAO().findOne(["id"], {
                room_uuid: roomUUID,
            });

            if (roomInfo !== undefined) {
                commands.push(
                    RoomDAO(t).update(
                        {
                            begin_time,
                            end_time,
                        },
                        {
                            room_uuid: roomUUID,
                        },
                    ),
                );
            }

            return Promise.all(commands);
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

interface UpdatePeriodicSubRoomBody {
    periodicUUID: string;
    roomUUID: string;
    beginTime: number;
    endTime: number;
}

export const updatePeriodicSubRoomSchemaType: FastifySchema<{
    body: UpdatePeriodicSubRoomBody;
}> = {
    body: {
        type: "object",
        required: ["periodicUUID", "roomUUID", "beginTime", "endTime"],
        properties: {
            periodicUUID: {
                type: "string",
                format: "uuid-v4",
            },
            roomUUID: {
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
        },
    },
};

interface UpdatePeriodicSubRoomResponse {}
