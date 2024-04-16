import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import { RoomStatus } from "../../../../model/room/Constants";
import { LessThan, MoreThan } from "typeorm";
import { compareDesc, toDate } from "date-fns/fp";
import {
    beginTimeGreaterThanEndTime,
    timeExceedRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/update/periodic-sub-room",
    auth: true,
})
export class UpdatePeriodicSubRoom extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["periodicUUID", "roomUUID", "beginTime", "endTime"],
            properties: {
                periodicUUID: {
                    type: "string",
                },
                roomUUID: {
                    type: "string",
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

    public async execute(): Promise<Response<ResponseType>> {
        const { periodicUUID, roomUUID, beginTime, endTime } = this.body;
        const userUUID = this.userUUID;

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
                if (beginTimeGreaterThanEndTime(beginTime, endTime)) {
                    return {
                        status: Status.Failed,
                        code: ErrorCode.ParamsCheckFailed,
                        message: "begin time must be earlier than end time",
                    };
                }

                if (timeIntervalLessThanFifteenMinute(beginTime, endTime)) {
                    return {
                        status: Status.Failed,
                        code: ErrorCode.ParamsCheckFailed,
                        message: "duration must be greater than 15 minutes",
                    };
                }
            }
        }

        const previousPeriodicRoom = await RoomPeriodicDAO().findOne(
            ["begin_time"],
            {
                periodic_uuid: periodicUUID,
                begin_time: LessThan(periodicRoomInfo.begin_time),
            },
            ["begin_time", "DESC"],
        );

        const nextPeriodicRoom = await RoomPeriodicDAO().findOne(
            ["begin_time", "end_time"],
            {
                periodic_uuid: periodicUUID,
                begin_time: MoreThan(periodicRoomInfo.begin_time),
            },
            ["begin_time", "ASC"],
        );

        if (isChangeBeginTime) {
            // it must be later than the current time
            if (timeExceedRedundancyOneMinute(beginTime)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                    message: "begin time must be later than the current time",
                };
            }

            // the modified begin time must between (previous room begin time, next room begin time)
            // this is needed for correct periodic room sorting order
            if (previousPeriodicRoom && !(+previousPeriodicRoom.begin_time < beginTime)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                    message: "begin time must be later than the previous room's begin time",
                };
            }

            if (nextPeriodicRoom && !(beginTime < +nextPeriodicRoom.begin_time)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                    message: "begin time must be earlier than the next room's begin time",
                };
            }
        }

        // the modified end time must be earlier than the end time of the next room
        if (isChangeEndTime) {
            if (nextPeriodicRoom && !(endTime <= +nextPeriodicRoom.end_time)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                    message: "end time must be earlier than the next room's end time",
                };
            }
        }

        await dataSource.transaction(async t => {
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
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        periodicUUID: string;
        roomUUID: string;
        beginTime: number;
        endTime: number;
    };
}

interface ResponseType {}
