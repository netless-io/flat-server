import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { In, Not } from "typeorm";
import { Status } from "../../../../constants/Project";
import { PeriodicStatus, RoomStatus, Week } from "../../../../model/room/Constants";
import { ErrorCode } from "../../../../ErrorCode";
import {
    RoomPeriodicConfigDAO,
    RoomPeriodicDAO,
    RoomPeriodicUserDAO,
    UserDAO,
} from "../../../../dao";
import { AbstractController } from "../../../../abstract/Controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/info/periodic",
    auth: true,
})
export class PeriodicInfo extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["periodicUUID"],
            properties: {
                periodicUUID: {
                    type: "string",
                    format: "uuid-v4",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { periodicUUID } = this.body;
        const userUUID = this.userUUID;

        const periodicRoomUserInfo = await RoomPeriodicUserDAO().findOne(["id"], {
            periodic_uuid: periodicUUID,
            user_uuid: userUUID,
        });

        if (periodicRoomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const periodicConfig = await RoomPeriodicConfigDAO().findOne(
            ["end_time", "rate", "owner_uuid", "periodic_status", "room_type", "title", "weeks"],
            {
                periodic_uuid: periodicUUID,
            },
        );

        if (periodicConfig === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const {
            title,
            rate,
            end_time,
            owner_uuid,
            room_type,
            periodic_status,
            weeks,
        } = periodicConfig;

        const userInfo = await UserDAO().findOne(["user_name"], {
            user_uuid: owner_uuid,
        });

        if (userInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }

        if (periodic_status === PeriodicStatus.Stopped) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicIsEnded,
            };
        }

        const rooms = await RoomPeriodicDAO().find(
            ["room_status", "begin_time", "end_time", "fake_room_uuid"],
            {
                periodic_uuid: periodicUUID,
                room_status: Not(In([RoomStatus.Stopped])),
            },
        );

        // only in the case of very boundary, will come here
        if (rooms.length === 0) {
            return {
                status: Status.Failed,
                code: ErrorCode.ServerFail,
            };
        }

        return {
            status: Status.Success,
            data: {
                periodic: {
                    ownerUUID: owner_uuid,
                    ownerUserName: userInfo.user_name,
                    roomType: room_type,
                    endTime: end_time.valueOf(),
                    rate: rate || null,
                    title,
                    weeks: weeks.split(",").map(week => Number(week)) as Week[],
                },
                rooms: rooms.map(({ fake_room_uuid, begin_time, end_time, room_status }) => {
                    return {
                        roomUUID: fake_room_uuid,
                        beginTime: begin_time.valueOf(),
                        endTime: end_time.valueOf(),
                        roomStatus: room_status,
                    };
                }),
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        periodicUUID: string;
    };
}

interface ResponseType {
    periodic: {
        ownerUUID: string;
        ownerUserName: string;
        roomType: string;
        endTime: number;
        rate: number | null;
        title: string;
        weeks: Week[];
    };
    rooms: Array<{
        roomUUID: string;
        beginTime: number;
        endTime: number;
        roomStatus: RoomStatus;
    }>;
}
