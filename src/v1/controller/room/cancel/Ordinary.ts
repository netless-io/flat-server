import { Controller, FastifySchema } from "../../../../types/Server";
import { getConnection } from "typeorm";
import { Status } from "../../../../constants/Project";
import { RoomStatus } from "../../../../model/room/Constants";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomUserDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/Room";
import { parseError } from "../../../../Logger";

export const cancelOrdinary: Controller<CancelOrdinaryRequest, CancelOrdinaryResponse> = async ({
    req,
    logger,
}) => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomInfo = await RoomDAO().findOne(
            ["room_status", "owner_uuid", "periodic_uuid", "whiteboard_room_uuid"],
            {
                room_uuid: roomUUID,
            },
        );

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (roomInfo.periodic_uuid !== "") {
            return {
                status: Status.Failed,
                code: ErrorCode.NotPermission,
            };
        }

        // the owner of the room cannot delete this lesson while the room is running
        if (roomInfo.owner_uuid === userUUID && roomIsRunning(roomInfo.room_status)) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomIsRunning,
            };
        }

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomUserDAO(t).remove({
                    room_uuid: roomUUID,
                    user_uuid: userUUID,
                }),
            );

            if (roomInfo.owner_uuid === userUUID && roomInfo.room_status === RoomStatus.Idle) {
                commands.push(
                    RoomDAO(t).remove({
                        room_uuid: roomUUID,
                    }),
                );

                await Promise.all(commands);

                // after the room owner cancels the room, block the whiteboard room
                // this operation must be placed in the last place
                await whiteboardBanRoom(roomInfo.whiteboard_room_uuid);

                return;
            }

            await Promise.all(commands);
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

interface CancelOrdinaryRequest {
    body: {
        roomUUID: string;
    };
}

export const cancelOrdinarySchemaType: FastifySchema<CancelOrdinaryRequest> = {
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

interface CancelOrdinaryResponse {}
