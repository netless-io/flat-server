import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { getConnection } from "typeorm";
import { Status } from "../../../../constants/Project";
import { PeriodicStatus, RoomStatus } from "../../../../model/room/Constants";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/Room";
import { getNextPeriodicRoomInfo, updateNextPeriodicRoomInfo } from "../../../service/Periodic";
import { RoomPeriodicModel } from "../../../../model/room/RoomPeriodic";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/update-status/stopped",
    auth: true,
})
export class UpdateStatusStopped extends AbstractController<RequestType, ResponseType> {
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
                                region: roomInfo.region,
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
                await whiteboardBanRoom(roomInfo.region, roomInfo.whiteboard_room_uuid);
            },
        );

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.currentProcessFailed(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
    };
}

interface ResponseType {}
