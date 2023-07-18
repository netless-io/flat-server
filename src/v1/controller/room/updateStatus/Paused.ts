import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { RoomDAO, RoomPeriodicDAO } from "../../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import { RoomStatus } from "../../../../model/room/Constants";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/update-status/paused",
    auth: true,
})
export class UpdateStatusPaused extends AbstractController<RequestType, ResponseType> {
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

        const roomInfo = await RoomDAO().findOne(["room_status"], {
            room_uuid: roomUUID,
            owner_uuid: userUUID,
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (roomInfo.room_status === RoomStatus.Paused) {
            return {
                status: Status.Success,
                data: {},
            };
        }

        if (roomInfo.room_status !== RoomStatus.Started) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotIsRunning,
            };
        }

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomDAO(t).update(
                    {
                        room_status: RoomStatus.Paused,
                    },
                    {
                        room_uuid: roomUUID,
                    },
                ),
            );

            commands.push(
                RoomPeriodicDAO(t).update(
                    {
                        room_status: RoomStatus.Paused,
                    },
                    {
                        fake_room_uuid: roomUUID,
                    },
                ),
            );

            return Promise.all(commands);
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
