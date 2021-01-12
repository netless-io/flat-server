import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { getConnection } from "typeorm";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../dao";
import { roomIsRunning } from "../utils/Room";
import { getNextRoomPeriodicInfo, updateNextRoomPeriodicInfo } from "../../../service/Periodic";
import { PeriodicStatus } from "../Constants";

export const cancelPeriodicSubRoom = async (
    req: PatchRequest<{
        Body: CancelPeriodicSubRoomBody;
    }>,
): Response<CancelPeriodicSubRoomResponse> => {
    const { periodicUUID, roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const periodicConfig = await RoomPeriodicConfigDAO().findOne(["title"], {
            periodic_uuid: periodicUUID,
            owner_uuid: userUUID,
        });

        if (periodicConfig === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const { title } = periodicConfig;

        const checkRoomInPeriodic = await RoomPeriodicDAO().findOne(["id"], {
            periodic_uuid: periodicUUID,
            fake_room_uuid: roomUUID,
        });

        if (checkRoomInPeriodic === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const roomInfo = await RoomDAO().findOne(["room_status", "owner_uuid"], {
            periodic_uuid: periodicUUID,
            room_uuid: roomUUID,
            owner_uuid: userUUID,
        });

        // room status is running, owner can't cancel current room
        if (roomInfo && roomIsRunning(roomInfo.room_status)) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomIsRunning,
            };
        }

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomPeriodicDAO(t).remove({
                    periodic_uuid: periodicUUID,
                    fake_room_uuid: roomUUID,
                }),
            );

            if (roomInfo) {
                commands.push(
                    RoomDAO(t).remove({
                        room_uuid: roomUUID,
                    }),
                );

                const nextRoomPeriodicInfo = await getNextRoomPeriodicInfo(periodicUUID, roomUUID);

                console.log(nextRoomPeriodicInfo);

                if (nextRoomPeriodicInfo) {
                    commands.push(
                        ...(await updateNextRoomPeriodicInfo({
                            transaction: t,
                            periodicUUID,
                            userUUID,
                            title,
                            ...nextRoomPeriodicInfo,
                        })),
                    );
                } else {
                    commands.push(
                        RoomPeriodicConfigDAO(t).update(
                            {
                                periodic_status: PeriodicStatus.Stopped,
                            },
                            {
                                periodic_uuid: periodicUUID,
                            },
                        ),
                    );
                }
            }

            await Promise.all(commands);
            // qing qiu
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

interface CancelPeriodicSubRoomBody {
    periodicUUID: string;
    roomUUID: string;
}

export const cancelPeriodicSubRoomSchemaType: FastifySchema<{
    body: CancelPeriodicSubRoomBody;
}> = {
    body: {
        type: "object",
        required: ["periodicUUID"],
        properties: {
            periodicUUID: {
                type: "string",
                format: "uuid-v4",
            },
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};

interface CancelPeriodicSubRoomResponse {}
