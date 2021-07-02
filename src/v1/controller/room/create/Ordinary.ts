import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import { Status } from "../../../../constants/Project";
import { Controller, FastifySchema } from "../../../../types/Server";
import { v4 } from "uuid";
import { addHours, toDate } from "date-fns/fp";
import { getConnection } from "typeorm";
import cryptoRandomString from "crypto-random-string";
import { whiteboardCreateRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomUserDAO } from "../../../../dao";
import {
    beginTimeLessEndTime,
    beginTimeExceedRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";
import { parseError } from "../../../../logger";

export const createOrdinary: Controller<CreateOrdinaryRequest, CreateOrdinaryResponse> = async ({
    req,
    logger,
}) => {
    const { title, type, beginTime, endTime } = req.body;
    const { userUUID } = req.user;

    {
        if (beginTimeExceedRedundancyOneMinute(beginTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        if (endTime) {
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

    const roomUUID = v4();
    try {
        const roomData = {
            periodic_uuid: "",
            owner_uuid: userUUID,
            title,
            room_type: type,
            room_status: RoomStatus.Idle,
            room_uuid: roomUUID,
            whiteboard_room_uuid: await whiteboardCreateRoom(),
            begin_time: toDate(beginTime),
            end_time: endTime ? toDate(endTime) : addHours(1, beginTime),
        };

        const roomUserData = {
            room_uuid: roomData.room_uuid,
            user_uuid: userUUID,
            rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
        };

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(RoomDAO(t).insert(roomData));

            commands.push(RoomUserDAO(t).insert(roomUserData));

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {
                roomUUID,
            },
        };
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface CreateOrdinaryRequest {
    body: {
        title: string;
        type: RoomType;
        beginTime: number;
        endTime?: number;
    };
}

export const createOrdinarySchemaType: FastifySchema<CreateOrdinaryRequest> = {
    body: {
        type: "object",
        required: ["title", "type", "beginTime"],
        properties: {
            title: {
                type: "string",
                maxLength: 50,
            },
            type: {
                type: "string",
                enum: [RoomType.OneToOne, RoomType.SmallClass, RoomType.BigClass],
            },
            beginTime: {
                type: "integer",
                format: "unix-timestamp",
            },
            endTime: {
                type: "integer",
                format: "unix-timestamp",
                nullable: true,
            },
        },
    },
};

interface CreateOrdinaryResponse {
    roomUUID: string;
}
