import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { getConnection, getRepository } from "typeorm";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { RoomPeriodicUserModel } from "../../../model/room/RoomPeriodicUser";
import { RoomPeriodicModel } from "../../../model/room/RoomPeriodic";

export const cancelPeriodic = async (
    req: PatchRequest<{
        Body: CancelPeriodicBody;
    }>,
): Response<CancelPeriodicResponse> => {
    const { periodicUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const checkUserInPeriodicRoom = await getRepository(RoomPeriodicUserModel).findOne({
            select: ["id"],
            where: {
                periodic_uuid: periodicUUID,
                user_uuid: userUUID,
                is_delete: false,
            },
        });

        if (checkUserInPeriodicRoom === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const periodicConfig = await getRepository(RoomPeriodicConfigModel).findOne({
            select: ["owner_uuid"],
            where: {
                periodic_uuid: periodicUUID,
                is_delete: false,
            },
        });

        if (periodicConfig === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const roomInfo = await getRepository(RoomModel)
            .createQueryBuilder()
            .select(["room_uuid", "room_status", "owner_uuid"])
            .where(
                `periodic_uuid = :periodicUUID
                AND room_status NOT IN (:...notRoomStatus)
                AND is_delete = false`,
                {
                    periodicUUID,
                    notRoomStatus: [RoomStatus.Stopped],
                },
            )
            .getRawOne<Pick<RoomModel, "room_uuid" | "room_status" | "owner_uuid">>();

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.CanRetry,
            };
        }

        // room status is running, owner can't cancel current room
        if (roomInfo.owner_uuid === userUUID && roomInfo.room_status === RoomStatus.Running) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomIsRunning,
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
                        room_uuid: roomInfo.room_uuid,
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
                            room_uuid: roomInfo.room_uuid,
                            is_delete: false,
                        })
                        .execute(),
                );
            }

            commands.push(
                t
                    .createQueryBuilder()
                    .update(RoomPeriodicUserModel)
                    .set({
                        is_delete: true,
                    })
                    .where({
                        periodic_uuid: periodicUUID,
                        user_uuid: userUUID,
                        is_delete: false,
                    })
                    .execute(),
            );

            if (periodicConfig.owner_uuid === userUUID) {
                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomPeriodicModel)
                        .set({
                            is_delete: true,
                        })
                        .where(
                            `periodic_uuid = :periodicUUID
                            AND room_status NOT IN (:...notRoomStatus)
                            AND is_delete = false`,
                            {
                                periodicUUID,
                                // the logic here shows that there is only one situation in the state: Pending
                                // `NOT IN` is used here just to be on the safe side
                                notRoomStatus: [RoomStatus.Stopped],
                            },
                        )
                        .execute(),
                );

                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomPeriodicConfigModel)
                        .set({
                            is_delete: true,
                        })
                        .where({
                            periodic_uuid: periodicUUID,
                            is_delete: false,
                        })
                        .execute(),
                );
            }

            return await Promise.all(commands);
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

interface CancelPeriodicBody {
    periodicUUID: string;
}

export const cancelPeriodicSchemaType: FastifySchema<{
    body: CancelPeriodicBody;
}> = {
    body: {
        type: "object",
        required: ["periodicUUID"],
        properties: {
            periodicUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};

interface CancelPeriodicResponse {}
