import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { RoomDAO } from "../../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import { toDate } from "date-fns/fp";
import { checkUpdateBeginAndEndTime } from "./Utils";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { aliGreenText } from "../../../utils/AliGreen";
import { ControllerError } from "../../../../error/ControllerError";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/update/ordinary",
    auth: true,
})
export class UpdateOrdinary extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID", "beginTime", "endTime", "title", "type"],
            properties: {
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

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID, beginTime, endTime, title, type } = this.body;
        const userUUID = this.userUUID;

        if (await aliGreenText.textNonCompliant(title)) {
            throw new ControllerError(ErrorCode.NonCompliant);
        }

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
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
        beginTime: number;
        endTime: number;
        title: string;
        type: RoomType;
    };
}

interface ResponseType {}
