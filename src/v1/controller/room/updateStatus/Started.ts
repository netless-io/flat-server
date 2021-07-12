import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { getConnection } from "typeorm";
import { Status } from "../../../../constants/Project";
import { PeriodicStatus, RoomStatus } from "../../../../model/room/Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../../dao";
import { roomIsRunning } from "../utils/Room";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/update-status/started",
    auth: true,
})
export class UpdateStatusStarted extends AbstractController<RequestType, ResponseType> {
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

        const roomInfo = await RoomDAO().findOne(["room_status", "owner_uuid", "periodic_uuid"], {
            room_uuid: roomUUID,
            owner_uuid: userUUID,
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        // if the room is running, return
        if (roomIsRunning(roomInfo.room_status)) {
            return {
                status: Status.Success,
                data: {},
            };
        }

        if (roomInfo.room_status === RoomStatus.Stopped) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomIsEnded,
            };
        }

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            const beginTime = new Date();

            commands.push(
                RoomDAO(t).update(
                    {
                        room_status: RoomStatus.Started,
                        begin_time: beginTime,
                    },
                    {
                        room_uuid: roomUUID,
                    },
                ),
            );

            if (roomInfo.periodic_uuid !== "") {
                commands.push(
                    RoomPeriodicConfigDAO(t).update(
                        {
                            periodic_status: PeriodicStatus.Started,
                        },
                        {
                            periodic_uuid: roomInfo.periodic_uuid,
                            periodic_status: PeriodicStatus.Idle,
                        },
                    ),
                );

                commands.push(
                    RoomPeriodicDAO(t).update(
                        {
                            room_status: RoomStatus.Started,
                            begin_time: beginTime,
                        },
                        {
                            fake_room_uuid: roomUUID,
                        },
                    ),
                );
            }

            return await Promise.all(commands);
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
