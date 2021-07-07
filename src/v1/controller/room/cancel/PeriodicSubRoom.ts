import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { getConnection } from "typeorm";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/Room";
import { getNextPeriodicRoomInfo, updateNextPeriodicRoomInfo } from "../../../service/Periodic";
import { PeriodicStatus } from "../../../../model/room/Constants";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { AbstractController } from "../../../../abstract/Controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/cancel/periodic-sub-room",
    auth: true,
})
export class CancelPeriodicSubRoom extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
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

    public async execute(): Promise<Response<ResponseType>> {
        const { periodicUUID, roomUUID } = this.body;
        const userUUID = this.userUUID;

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
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        periodicUUID: string;
        roomUUID: string;
    };
}

interface ResponseType {}
