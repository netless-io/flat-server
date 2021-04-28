import { Controller, FastifySchema } from "../../../../types/Server";
import { RoomDAO, RoomPeriodicDAO } from "../../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import { RoomStatus } from "../../../../model/room/Constants";
import { getConnection } from "typeorm";
import { parseError } from "../../../../Logger";

export const paused: Controller<PausedRequest, PausedResponse> = async ({ req, logger }) => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
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
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface PausedRequest {
    body: {
        roomUUID: string;
    };
}

export const pausedSchemaType: FastifySchema<PausedRequest> = {
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
