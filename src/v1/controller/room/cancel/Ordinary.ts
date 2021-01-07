import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { getConnection, getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { whiteboardBanRoom } from "../../../utils/Whiteboard";
import { ErrorCode } from "../../../../ErrorCode";

export const cancelOrdinary = async (
    req: PatchRequest<{
        Body: CancelOrdinaryBody;
    }>,
): Response<CancelOrdinaryResponse> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomInfo = await getRepository(RoomModel).findOne({
            select: ["room_status", "owner_uuid", "periodic_uuid", "whiteboard_room_uuid"],
            where: {
                room_uuid: roomUUID,
                is_delete: false,
            },
        });

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
                t
                    .createQueryBuilder()
                    .update(RoomUserModel)
                    .set({
                        is_delete: true,
                    })
                    .where({
                        room_uuid: roomUUID,
                        user_uuid: userUUID,
                        is_delete: false,
                    })
                    .execute(),
            );

            if (roomInfo.owner_uuid === userUUID && roomInfo.room_status === RoomStatus.Pending) {
                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomModel)
                        .set({
                            is_delete: true,
                        })
                        .where({
                            room_uuid: roomUUID,
                            is_delete: false,
                        })
                        .execute(),
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
