import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO, RoomUserDAO } from "../../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import { RoomStatus, RoomType, Week } from "../../../../model/room/Constants";
import { In } from "typeorm";
import { Periodic } from "../Types";
import { checkUpdateBeginAndEndTime } from "./Utils";
import { compareDesc, differenceInCalendarDays, toDate } from "date-fns/fp";
import { calculatePeriodicDates } from "../utils/CalculatePeriodicDates";
import {
    whiteboardBanRoom,
    whiteboardCreateRoom,
} from "../../../utils/request/whiteboard/WhiteboardRequest";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { parseError } from "../../../../logger";
import { aliGreenText } from "../../../utils/AliGreen";
import { ControllerError } from "../../../../error/ControllerError";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { generateRoomUUID } from "../create/Utils";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/update/periodic",
    auth: true,
})
export class UpdatePeriodic extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["periodicUUID", "beginTime", "endTime", "title", "type"],
            properties: {
                periodicUUID: {
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
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { periodicUUID, beginTime, endTime, title, type, periodic } = this.body;
        const userUUID = this.userUUID;

        if (await aliGreenText.textNonCompliant(title)) {
            throw new ControllerError(ErrorCode.NonCompliant);
        }

        const periodicConfigInfo = await RoomPeriodicConfigDAO().findOne(
            ["room_origin_begin_time", "room_origin_end_time", "end_time", "rate", "region"],
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

        const { room_origin_begin_time, room_origin_end_time, end_time, rate, region } =
            periodicConfigInfo;

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
                fake_room_uuid: generateRoomUUID(),
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

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomPeriodicConfigDAO(t).update(
                    {
                        room_origin_begin_time: toDate(beginTime),
                        room_origin_end_time: toDate(endTime),
                        end_time: periodic.endTime
                            ? toDate(periodic.endTime)
                            : dates[dates.length - 1].start,
                        rate: periodic.rate || 0,
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
                    whiteboard_room_uuid: await whiteboardCreateRoom(region),
                    begin_time: willAddRoom[0].begin_time,
                    end_time: willAddRoom[0].end_time,
                    region,
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
            whiteboardBanRoom(region, roomInfo.whiteboard_room_uuid).catch(error => {
                this.logger.warn("ban room failed", parseError(error));
            });
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
        beginTime: number;
        endTime: number;
        title: string;
        type: RoomType;
        periodic: Periodic;
    };
}

interface ResponseType {}
