import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { RoomDAO, RoomPeriodicDAO } from "../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../Constants";
import { RoomStatus } from "../Constants";
import { getConnection } from "typeorm";

export const paused = async (
    req: PatchRequest<{
        Body: PausedBody;
    }>,
): Response<PausedResponse> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    const roomInfo = await RoomDAO().findOne(["room_status"], {
        room_uuid: roomUUID,
        owner_uuid: userUUID,
    });

    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotFound,
        };
    }

    if (roomInfo.room_status === RoomStatus.Paused) {
        return {
            status: Status.Success,
            data: {},
        };
    }

    if (roomInfo.room_status !== RoomStatus.Started) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotIsRunning,
        };
    }

    try {
        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomDAO(t).update(
                    {
                        room_status: RoomStatus.Paused,
                    },
                    {
                        room_uuid: roomUUID,
                    },
                ),
            );

            commands.push(
                RoomPeriodicDAO(t).update(
                    {
                        room_status: RoomStatus.Paused,
                    },
                    {
                        fake_room_uuid: roomUUID,
                    },
                ),
            );

            return Promise.all(commands);
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

interface PausedBody {
    roomUUID: string;
}

export const pausedSchemaType: FastifySchema<{
    body: PausedBody;
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

interface PausedResponse {}
