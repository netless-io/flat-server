import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { getConnection } from "typeorm";
import { Status } from "../../../../Constants";
import { PeriodicStatus, RoomStatus } from "../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../dao";
import { roomIsRunning } from "../utils/Room";

export const started = async (
    req: PatchRequest<{
        Body: StartedBody;
    }>,
): Response<StartedResponse> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomInfo = await RoomDAO().findOne(["room_status", "owner_uuid", "periodic_uuid"], {
            room_uuid: roomUUID,
            owner_uuid: userUUID,
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        // if the room is running, return
        if (roomIsRunning(roomInfo.room_status)) {
            return {
                status: Status.Success,
                data: {},
            };
        }

        if (roomInfo.room_status === RoomStatus.Stopped) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomIsEnded,
            };
        }

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            const beginTime = new Date();

            commands.push(
                RoomDAO(t).update(
                    {
                        room_status: RoomStatus.Started,
                        begin_time: beginTime,
                    },
                    {
                        room_uuid: roomUUID,
                    },
                ),
            );

            if (roomInfo.periodic_uuid !== "") {
                commands.push(
                    RoomPeriodicConfigDAO(t).update(
                        {
                            periodic_status: PeriodicStatus.Started,
                        },
                        {
                            periodic_uuid: roomInfo.periodic_uuid,
                            periodic_status: PeriodicStatus.Idle,
                        },
                    ),
                );

                commands.push(
                    RoomPeriodicDAO(t).update(
                        {
                            room_status: RoomStatus.Started,
                            begin_time: beginTime,
                        },
                        {
                            fake_room_uuid: roomUUID,
                        },
                    ),
                );
            }

            return await Promise.all(commands);
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

interface StartedBody {
    roomUUID: string;
}

export const startedSchemaType: FastifySchema<{
    body: StartedBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};

interface StartedResponse {}
