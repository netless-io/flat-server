import { PeriodicStatus, RoomStatus, RoomType, Week } from "../../../../model/room/Constants";
import { Periodic } from "../Types";
import { Region, Status } from "../../../../constants/Project";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { v4 } from "uuid";
import { differenceInCalendarDays, toDate } from "date-fns/fp";
import { getConnection } from "typeorm";
import cryptoRandomString from "crypto-random-string";
import { whiteboardCreateRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { ErrorCode } from "../../../../ErrorCode";
import {
    RoomDAO,
    RoomPeriodicConfigDAO,
    RoomPeriodicDAO,
    RoomPeriodicUserDAO,
    RoomUserDAO,
} from "../../../../dao";
import { calculatePeriodicDates } from "../utils/Periodic";
import { checkBeginAndEndTime } from "../utils/CheckTime";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/create/periodic",
    auth: true,
})
export class CreatePeriodic extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["title", "type", "beginTime", "endTime", "region", "periodic"],
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
                region: {
                    type: "string",
                    enum: [Region.CN_HZ, Region.US_SV, Region.SG, Region.IN_MUM, Region.GB_LON],
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
        const { title, type, beginTime, endTime, region, periodic } = this.body;
        const userUUID = this.userUUID;

        if (!checkBeginAndEndTime(beginTime, endTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        // check periodic.endTime
        {
            if (periodic.endTime) {
                // beginTime(day) > periodic.endTime(day)
                if (differenceInCalendarDays(beginTime)(periodic.endTime) < 0) {
                    return {
                        status: Status.Failed,
                        code: ErrorCode.ParamsCheckFailed,
                    };
                }
            }
        }

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
                    weeks: periodic.weeks.join(","),
                    rate: periodic.rate || 0,
                    end_time: periodic.endTime
                        ? toDate(periodic.endTime)
                        : dates[dates.length - 1].start,
                    room_type: type,
                    periodic_uuid: periodicUUID,
                    region,
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
                        whiteboard_room_uuid: await whiteboardCreateRoom(region),
                        begin_time: roomData[0].begin_time,
                        end_time: roomData[0].end_time,
                        region,
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

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.currentProcessFailed(error);
    }
}

interface RequestType {
    body: {
        title: string;
        type: RoomType;
        beginTime: number;
        endTime: number;
        region: Region;
        periodic: Periodic;
    };
}

interface ResponseType {}
