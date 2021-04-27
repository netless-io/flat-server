import { Controller, FastifySchema } from "../../../../types/Server";
import { getConnection } from "typeorm";
import { Status } from "../../../../constants/Project";
import { PeriodicStatus, RoomStatus } from "../../../../model/room/Constants";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/Room";
import { getNextPeriodicRoomInfo, updateNextPeriodicRoomInfo } from "../../../service/Periodic";
import { RoomPeriodicModel } from "../../../../model/room/RoomPeriodic";
import { parseError } from "../../../../Logger";

export const stopped: Controller<StoppedRequest, StoppedResponse> = async ({ req, logger }) => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomInfo = await RoomDAO().findOne(
            ["room_status", "owner_uuid", "periodic_uuid", "whiteboard_room_uuid"],
            {
                room_uuid: roomUUID,
                owner_uuid: userUUID,
            },
        );

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (!roomIsRunning(roomInfo.room_status)) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotIsRunning,
            };
        }

        const { periodic_uuid } = roomInfo;

        let periodicRoomInfo: Pick<RoomPeriodicModel, "begin_time">;
        if (periodic_uuid !== "") {
            // @ts-ignore
            periodicRoomInfo = await RoomPeriodicDAO().findOne(["begin_time"], {
                periodic_uuid: periodic_uuid,
                fake_room_uuid: roomUUID,
            });

            if (periodicRoomInfo === undefined) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.RoomNotFound,
                };
            }
        }

        await getConnection().transaction(
            async (t): Promise<void> => {
                const commands: Promise<unknown>[] = [];
                const roomDAO = RoomDAO(t);

                const endTime = new Date();
                commands.push(
                    roomDAO.update(
                        {
                            room_status: RoomStatus.Stopped,
                            end_time: endTime,
                        },
                        {
                            room_uuid: roomUUID,
                        },
                    ),
                );

                if (periodic_uuid !== "") {
                    commands.push(
                        RoomPeriodicDAO(t).update(
                            {
                                room_status: RoomStatus.Stopped,
                                end_time: endTime,
                            },
                            {
                                fake_room_uuid: roomUUID,
                            },
                        ),
                    );

                    const nextRoomPeriodicInfo = await getNextPeriodicRoomInfo(
                        periodic_uuid,
                        periodicRoomInfo.begin_time,
                    );

                    if (nextRoomPeriodicInfo) {
                        const periodicRoomConfig = await RoomPeriodicConfigDAO().findOne(
                            ["title", "room_type"],
                            {
                                periodic_uuid,
                            },
                        );

                        // unless you encounter special boundary conditions, you will not get here
                        if (periodicRoomConfig === undefined) {
                            throw new Error("Enter a special boundary situation");
                        }

                        const { title, room_type } = periodicRoomConfig;
                        commands.concat(
                            await updateNextPeriodicRoomInfo({
                                transaction: t,
                                periodic_uuid,
                                user_uuid: userUUID,
                                title,
                                room_type,
                                ...nextRoomPeriodicInfo,
                            }),
                        );
                    } else {
                        commands.push(
                            RoomPeriodicConfigDAO(t).update(
                                {
                                    periodic_status: PeriodicStatus.Stopped,
                                },
                                {
                                    periodic_uuid,
                                },
                            ),
                        );
                    }
                }

                await Promise.all(commands);
                await whiteboardBanRoom(roomInfo.whiteboard_room_uuid);
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

interface StoppedRequest {
    body: {
        roomUUID: string;
    };
}

export const stoppedSchemaType: FastifySchema<StoppedRequest> = {
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

interface StoppedResponse {}
