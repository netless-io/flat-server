import { Controller, FastifySchema } from "../../../../types/Server";
import { RoomDAO } from "../../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import { toDate } from "date-fns/fp";
import { checkUpdateBeginAndEndTime } from "./Utils";
import { parseError } from "../../../../logger";

export const updateOrdinary: Controller<UpdateOrdinaryRequest, UpdateOrdinaryResponse> = async ({
    req,
    logger,
}) => {
    const { roomUUID, beginTime, endTime, title, type } = req.body;
    const { userUUID } = req.user;

    try {
        const roomInfo = await RoomDAO().findOne(["room_status", "begin_time", "end_time"], {
            room_uuid: roomUUID,
            owner_uuid: userUUID,
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (roomInfo.room_status !== RoomStatus.Idle) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotIsIdle,
            };
        }

        if (!checkUpdateBeginAndEndTime(beginTime, endTime, roomInfo)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        await RoomDAO().update(
            {
                title,
                begin_time: toDate(beginTime),
                end_time: toDate(endTime),
                room_type: type,
            },
            {
                room_uuid: roomUUID,
            },
        );

        return {
            status: Status.Success,
            data: {},
        };
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface UpdateOrdinaryRequest {
    body: {
        roomUUID: string;
        beginTime: number;
        endTime: number;
        title: string;
        type: RoomType;
    };
}

export const updateOrdinarySchemaType: FastifySchema<UpdateOrdinaryRequest> = {
    body: {
        type: "object",
        required: ["roomUUID", "beginTime", "endTime", "title", "type"],
        properties: {
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
            title: {
                type: "string",
            },
            type: {
                type: "string",
                enum: [RoomType.SmallClass, RoomType.BigClass, RoomType.OneToOne],
                maxLength: 50,
            },
        },
    },
};

interface UpdateOrdinaryResponse {}
