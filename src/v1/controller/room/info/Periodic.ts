import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { In, Not } from "typeorm";
import { Status } from "../../../../Constants";
import { PeriodicStatus, RoomStatus } from "../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomPeriodicConfigDAO, RoomPeriodicDAO, RoomPeriodicUserDAO } from "../../../dao";

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
            ["end_time", "rate", "owner_uuid", "periodic_status", "room_type"],
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

        if (periodicConfig.periodic_status === PeriodicStatus.Stopped) {
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
                code: ErrorCode.CanRetry,
            };
        }

        return {
            status: Status.Success,
            data: {
                periodic: {
                    ownerUUID: periodicConfig.owner_uuid,
                    roomType: periodicConfig.room_type,
                    endTime: periodicConfig.end_time,
                    rate: periodicConfig.rate || null,
                },
                rooms: rooms.map(({ fake_room_uuid, begin_time, end_time, room_status }) => {
                    return {
                        roomUUID: fake_room_uuid,
                        beginTime: begin_time,
                        endTime: end_time,
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
        roomType: string;
        endTime: Date;
        rate: number | null;
    };
    rooms: Array<{
        roomUUID: string;
        beginTime: Date;
        endTime: Date;
        roomStatus: RoomStatus;
    }>;
}
