import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { PeriodicStatus, RoomStatus } from "../../../../model/room/Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicDAO } from "../../../../dao";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

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
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID } = this.body;
        const userUUID = this.userUUID;

        const roomInfo = await RoomDAO().findOne(
            ["room_status", "owner_uuid", "periodic_uuid", "begin_time"],
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

        if (roomInfo.room_status === RoomStatus.Started) {
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

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            // const beginTime = roomInfo.room_status === RoomStatus.Paused ? roomInfo.begin_time : new Date();

            commands.push(
                RoomDAO(t).update(
                    {
                        room_status: RoomStatus.Started,
                        // begin_time will always be the scheduled time
                        // begin_time: beginTime,
                    },
                    {
                        room_uuid: roomUUID,
                    },
                ),
            );

            if (roomInfo.periodic_uuid !== "") {
                if (roomInfo.room_status === RoomStatus.Idle) {
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
                }

                commands.push(
                    RoomPeriodicDAO(t).update(
                        {
                            room_status: RoomStatus.Started,
                            // begin_time will always be the scheduled time
                            // begin_time: beginTime,
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
