import { Controller, FastifySchema } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { getConnection } from "typeorm";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/Room";
import { getNextPeriodicRoomInfo, updateNextPeriodicRoomInfo } from "../../../service/Periodic";
import { PeriodicStatus } from "../../../../model/room/Constants";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { parseError } from "../../../../logger";

export const cancelPeriodicSubRoom: Controller<
    CancelPeriodicSubRoomRequest,
    CancelPeriodicSubRoomResponse
> = async ({ req, logger }) => {
    const { periodicUUID, roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const periodicConfig = await RoomPeriodicConfigDAO().findOne(["title", "room_type"], {
            periodic_uuid: periodicUUID,
            owner_uuid: userUUID,
        });

        if (periodicConfig === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const { title, room_type } = periodicConfig;

        const periodicRoomInfo = await RoomPeriodicDAO().findOne(["begin_time"], {
            periodic_uuid: periodicUUID,
            fake_room_uuid: roomUUID,
        });

        if (periodicRoomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const roomInfo = await RoomDAO().findOne(
            ["room_status", "owner_uuid", "whiteboard_room_uuid"],
            {
                periodic_uuid: periodicUUID,
                room_uuid: roomUUID,
                owner_uuid: userUUID,
            },
        );

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

                const nextRoomPeriodicInfo = await getNextPeriodicRoomInfo(
                    periodicUUID,
                    periodicRoomInfo.begin_time,
                );

                if (nextRoomPeriodicInfo) {
                    commands.push(
                        ...(await updateNextPeriodicRoomInfo({
                            transaction: t,
                            periodic_uuid: periodicUUID,
                            user_uuid: userUUID,
                            title,
                            room_type,
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
            if (roomInfo) {
                await whiteboardBanRoom(roomInfo.whiteboard_room_uuid);
            }
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

interface CancelPeriodicSubRoomRequest {
    body: {
        periodicUUID: string;
        roomUUID: string;
    };
}

export const cancelPeriodicSubRoomSchemaType: FastifySchema<CancelPeriodicSubRoomRequest> = {
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
