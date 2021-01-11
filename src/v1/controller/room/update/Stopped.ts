import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { getConnection, MoreThanOrEqual } from "typeorm";
import { Status } from "../../../../Constants";
import { PeriodicStatus, RoomStatus } from "../Constants";
import { addMinutes } from "date-fns/fp";
import { whiteboardBanRoom, whiteboardCreateRoom } from "../../../utils/Whiteboard";
import cryptoRandomString from "crypto-random-string";
import { ErrorCode } from "../../../../ErrorCode";
import {
    RoomDAO,
    RoomPeriodicConfigDAO,
    RoomPeriodicDAO,
    RoomPeriodicUserDAO,
    RoomUserDAO,
} from "../../../dao";
import { roomIsRunning } from "../../../utils/Room";

export const stopped = async (
    req: PatchRequest<{
        Body: StoppedBody;
    }>,
): Response<StoppedResponse> => {
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

                    const nextRoomPeriodicInfo = await RoomPeriodicDAO().findOne(
                        ["begin_time", "end_time", "fake_room_uuid", "room_type"],
                        {
                            periodic_uuid,
                            room_status: RoomStatus.Idle,
                            end_time: MoreThanOrEqual(addMinutes(1, new Date())),
                        },
                        ["end_time", "ASC"],
                    );

                    if (nextRoomPeriodicInfo) {
                        const roomPeriodicConfig = await RoomPeriodicConfigDAO().findOne(
                            ["title"],
                            {
                                periodic_uuid,
                            },
                        );

                        // unless you encounter special boundary conditions, you will not get here
                        if (roomPeriodicConfig === undefined) {
                            throw new Error("Enter a special boundary situation");
                        }

                        const {
                            room_type,
                            fake_room_uuid,
                            begin_time,
                            end_time,
                        } = nextRoomPeriodicInfo;

                        commands.push(
                            roomDAO.insert({
                                periodic_uuid: periodic_uuid,
                                owner_uuid: userUUID,
                                title: roomPeriodicConfig.title,
                                room_type,
                                room_status: RoomStatus.Idle,
                                room_uuid: fake_room_uuid,
                                whiteboard_room_uuid: await whiteboardCreateRoom(
                                    roomPeriodicConfig.title,
                                ),
                                begin_time,
                                end_time,
                            }),
                        );

                        const periodicRoomAllUsers = await RoomPeriodicUserDAO().find(
                            ["user_uuid"],
                            {
                                periodic_uuid,
                            },
                        );

                        const transformRoomUser = periodicRoomAllUsers.map(({ user_uuid }) => {
                            return {
                                room_uuid: fake_room_uuid,
                                user_uuid: user_uuid,
                                rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
                            };
                        });

                        /**
                         * TODO: when the number exceeds 500, there will be performance problems
                         * Combining RoomUser and RoomPeriodicUsers should solve this potential problem
                         */
                        commands.push(RoomUserDAO(t).insert(transformRoomUser));
                    } else {
                        commands.push(
                            RoomPeriodicConfigDAO(t).update(
                                {
                                    periodic_status: PeriodicStatus.Stopped,
                                },
                                {
                                    periodic_uuid: roomInfo.periodic_uuid,
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
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface StoppedBody {
    roomUUID: string;
}

export const stoppedSchemaType: FastifySchema<{
    body: StoppedBody;
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

interface StoppedResponse {}
