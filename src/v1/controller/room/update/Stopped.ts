import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { getConnection } from "typeorm";
import { Status } from "../../../../Constants";
import { PeriodicStatus, RoomStatus } from "../Constants";
import { whiteboardBanRoom } from "../../../utils/Whiteboard";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../dao";
import { roomIsRunning } from "../utils/Room";
import { getNextRoomPeriodicInfo, updateNextRoomPeriodicInfo } from "../../../service/Periodic";

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

        const { periodic_uuid: periodicUUID } = roomInfo;

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

                if (periodicUUID !== "") {
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

                    const nextRoomPeriodicInfo = await getNextRoomPeriodicInfo(periodicUUID);

                    if (nextRoomPeriodicInfo) {
                        const roomPeriodicConfig = await RoomPeriodicConfigDAO().findOne(
                            ["title"],
                            {
                                periodic_uuid: periodicUUID,
                            },
                        );

                        // unless you encounter special boundary conditions, you will not get here
                        if (roomPeriodicConfig === undefined) {
                            throw new Error("Enter a special boundary situation");
                        }

                        commands.concat(
                            await updateNextRoomPeriodicInfo({
                                transaction: t,
                                periodicUUID,
                                userUUID,
                                title: roomPeriodicConfig.title,
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
                                    periodic_uuid: periodicUUID,
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
