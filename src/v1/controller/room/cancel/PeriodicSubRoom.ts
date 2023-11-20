import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/RoomStatus";
import { getNextPeriodicRoomInfo, updateNextPeriodicRoomInfo } from "../../../service/Periodic";
import { PeriodicStatus } from "../../../../model/room/Constants";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { parseError } from "../../../../logger";
import { rtcQueue } from "../../../queue";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

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
                },
                roomUUID: {
                    type: "string",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { periodicUUID, roomUUID } = this.body;
        const userUUID = this.userUUID;

        const periodicConfig = await RoomPeriodicConfigDAO().findOne(
            ["title", "room_type", "region"],
            {
                periodic_uuid: periodicUUID,
                owner_uuid: userUUID,
            },
        );

        if (periodicConfig === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const { title, room_type, region } = periodicConfig;

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

        let nextRoomUUID = null;
        await dataSource.transaction(async t => {
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
                    nextRoomUUID = nextRoomPeriodicInfo.fake_room_uuid;
                    commands.push(
                        ...(await updateNextPeriodicRoomInfo({
                            transaction: t,
                            periodic_uuid: periodicUUID,
                            user_uuid: userUUID,
                            title,
                            room_type,
                            region,
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
                whiteboardBanRoom(region, roomInfo.whiteboard_room_uuid).catch(error => {
                    this.logger.warn("ban room failed", parseError(error));
                });
            }
        });

        if (nextRoomUUID) {
            rtcQueue(nextRoomUUID);
        }

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
