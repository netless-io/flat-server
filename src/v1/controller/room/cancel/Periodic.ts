import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { In, Not } from "typeorm";
import { RoomStatus } from "../../../../model/room/Constants";
import {
    RoomDAO,
    RoomPeriodicConfigDAO,
    RoomPeriodicDAO,
    RoomPeriodicUserDAO,
    RoomUserDAO,
} from "../../../../dao";
import { roomIsRunning } from "../utils/RoomStatus";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/cancel/periodic",
    auth: true,
})
export class CancelPeriodic extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["periodicUUID"],
            properties: {
                periodicUUID: {
                    type: "string",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { periodicUUID } = this.body;
        const userUUID = this.userUUID;

        const periodicRoomUserInfo = await RoomPeriodicUserDAO().findOne(["id"], {
            periodic_uuid: periodicUUID,
            user_uuid: userUUID,
        });

        if (periodicRoomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const periodicConfig = await RoomPeriodicConfigDAO().findOne(["owner_uuid"], {
            periodic_uuid: periodicUUID,
        });

        if (periodicConfig === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const roomInfo = await RoomDAO().findOne(["room_uuid", "room_status", "owner_uuid"], {
            periodic_uuid: periodicUUID,
            room_status: Not(In([RoomStatus.Stopped])),
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.ServerFail,
            };
        }

        // room status is running, owner can't cancel current room
        if (roomInfo.owner_uuid === userUUID && roomIsRunning(roomInfo.room_status)) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomIsRunning,
            };
        }

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomUserDAO(t).remove({
                    room_uuid: roomInfo.room_uuid,
                    user_uuid: userUUID,
                }),
            );

            if (roomInfo.owner_uuid === userUUID && roomInfo.room_status === RoomStatus.Idle) {
                commands.push(
                    RoomDAO(t).remove({
                        room_uuid: roomInfo.room_uuid,
                    }),
                );
            }

            commands.push(
                RoomPeriodicUserDAO(t).remove({
                    periodic_uuid: periodicUUID,
                    user_uuid: userUUID,
                }),
            );

            if (periodicConfig.owner_uuid === userUUID) {
                commands.push(
                    RoomPeriodicDAO(t).remove({
                        periodic_uuid: periodicUUID,
                        // the logic here shows that there is only one situation in the state: Pending
                        // `NOT IN` is used here just to be on the safe side
                        room_status: Not(In([RoomStatus.Stopped])),
                    }),
                );

                commands.push(
                    RoomPeriodicConfigDAO(t).remove({
                        periodic_uuid: periodicUUID,
                    }),
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
        periodicUUID: string;
    };
}

interface ResponseType {}
