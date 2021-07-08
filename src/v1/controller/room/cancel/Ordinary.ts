import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { getConnection } from "typeorm";
import { Status } from "../../../../constants/Project";
import { RoomStatus } from "../../../../model/room/Constants";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomUserDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/Room";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/cancel/ordinary",
    auth: true,
})
export class CancelOrdinary extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
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

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID } = this.body;
        const userUUID = this.userUUID;

        const roomInfo = await RoomDAO().findOne(
            ["room_status", "owner_uuid", "periodic_uuid", "whiteboard_room_uuid", "region"],
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
                await whiteboardBanRoom(roomInfo.region, roomInfo.whiteboard_room_uuid);

                return;
            }

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
    };
}

interface ResponseType {}
