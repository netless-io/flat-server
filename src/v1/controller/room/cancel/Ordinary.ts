import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { getConnection } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomStatus } from "../Constants";
import { whiteboardBanRoom } from "../../../utils/Whiteboard";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomUserDAO } from "../../../dao";

export const cancelOrdinary = async (
    req: PatchRequest<{
        Body: CancelOrdinaryBody;
    }>,
): Response<CancelOrdinaryResponse> => {
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
        if (roomInfo.owner_uuid === userUUID && roomInfo.room_status === RoomStatus.Running) {
            return {
                status: Status.Failed,
                code: ErrorCode.SituationHasChanged,
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

            if (roomInfo.owner_uuid === userUUID && roomInfo.room_status === RoomStatus.Pending) {
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
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface CancelOrdinaryBody {
    roomUUID: string;
}

export const cancelOrdinarySchemaType: FastifySchema<{
    body: CancelOrdinaryBody;
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

interface CancelOrdinaryResponse {}
