import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { In, Not } from "typeorm";
import { Status } from "../../../../Constants";
import { PeriodicStatus, RoomStatus, Week } from "../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomPeriodicConfigDAO, RoomPeriodicDAO, RoomPeriodicUserDAO, UserDAO } from "../../../dao";

export const periodicInfo = async (
    req: PatchRequest<{
        Body: PeriodicInfoBody;
    }>,
): Response<PeriodicInfoResponse> => {
    const { periodicUUID } = req.body;
    const { userUUID } = req.user;

    try {
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
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface PeriodicInfoBody {
    periodicUUID: string;
}

export const periodicInfoSchemaType: FastifySchema<{
    body: PeriodicInfoBody;
}> = {
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

interface PeriodicInfoResponse {
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
