import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { getConnection, getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { RoomPeriodicModel } from "../../../model/room/RoomPeriodic";
import { addMinutes } from "date-fns/fp";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { whiteboardBanRoom, whiteboardCreateRoom } from "../../../utils/Whiteboard";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";
import { RoomPeriodicUserModel } from "../../../model/room/RoomPeriodicUser";
import { ErrorCode } from "../../../../ErrorCode";

export const stopped = async (
    req: PatchRequest<{
        Body: StoppedBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
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
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            });
        }

        // only the room owner can call this API
        if (roomInfo.owner_uuid !== userUUID) {
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.NotPermission,
            });
        }

        if (roomInfo.room_status !== RoomStatus.Running) {
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.SituationHasChanged,
            });
        }

        const { periodic_uuid } = roomInfo;

        await getConnection().transaction(
            async (t): Promise<void> => {
                const commands: Promise<unknown>[] = [];

                const endTime = new Date();
                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomModel)
                        .set({
                            room_status: RoomStatus.Stopped,
                            end_time: endTime,
                        })
                        .where({
                            room_uuid: roomUUID,
                            is_delete: false,
                        })
                        .execute(),
                );

                if (periodic_uuid !== "") {
                    commands.push(
                        t
                            .createQueryBuilder()
                            .update(RoomPeriodicModel)
                            .set({
                                room_status: RoomStatus.Stopped,
                                end_time: endTime,
                            })
                            .where({
                                fake_room_uuid: roomUUID,
                                is_delete: false,
                            })
                            .execute(),
                    );

                    const nextRoomPeriodicInfo = await t
                        .createQueryBuilder(RoomPeriodicModel, "rp")
                        .select(["begin_time", "end_time", "fake_room_uuid", "room_type"])
                        .where(
                            `periodic_uuid = :periodicUUID
                            AND room_status = :roomStatus
                            AND end_time >= :currentTime
                            AND is_delete = false`,
                            {
                                periodic_uuid,
                                roomStatus: RoomStatus.Pending,
                                // the end time of the next class must be greater than the current time (add one minutes, this is redundancy)
                                currentTime: addMinutes(1, new Date()),
                            },
                        )
                        .orderBy("rp.end_time", "ASC")
                        .getRawOne<RoomPeriodicModel | undefined>();

                    if (nextRoomPeriodicInfo) {
                        const roomPeriodicConfig = await t
                            .createQueryBuilder(RoomPeriodicConfigModel, "rpc")
                            .select("title")
                            .where({
                                periodic_uuid,
                                is_delete: false,
                            })
                            .getRawOne();

                        // unless you encounter special boundary conditions, you will not get here
                        if (roomPeriodicConfig === undefined) {
                            return reply.send({
                                status: Status.Failed,
                                code: ErrorCode.SituationHasChanged,
                            });
                        }

                        const {
                            room_type,
                            fake_room_uuid,
                            begin_time,
                            end_time,
                        } = nextRoomPeriodicInfo;

                        commands.push(
                            t.insert(RoomModel, {
                                periodic_uuid: periodic_uuid,
                                owner_uuid: userUUID,
                                title: roomPeriodicConfig.title,
                                room_type,
                                room_status: RoomStatus.Pending,
                                room_uuid: fake_room_uuid,
                                whiteboard_room_uuid: await whiteboardCreateRoom(
                                    roomPeriodicConfig.title,
                                ),
                                begin_time,
                                end_time,
                            }),
                        );

                        const periodicRoomAllUsers = await t
                            .createQueryBuilder(RoomPeriodicUserModel, "rpu")
                            .select("user_uuid")
                            .where(
                                `periodic_uuid = :periodicUUID
                                AND is_delete = false`,
                                {
                                    periodicUUID: periodic_uuid,
                                },
                            )
                            .getRawMany<Pick<RoomPeriodicUserModel, "user_uuid">>();

                        const transformRoomUser = periodicRoomAllUsers.map(({ user_uuid }) => {
                            return {
                                room_uuid: fake_room_uuid,
                                user_uuid: user_uuid,
                                rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
                            };
                        });

                        /**
                         * TODO: when the number exceeds 500, there will be performance problems
                         * Combining RoomUser and RoomPeriodicUsers should solve this potential problem
                         */
                        commands.push(t.insert(RoomUserModel, transformRoomUser));
                    } else {
                        commands.push(
                            t
                                .createQueryBuilder()
                                .update(RoomPeriodicConfigModel)
                                .set({
                                    periodic_status: RoomStatus.Stopped,
                                })
                                .where({
                                    periodic_uuid: roomInfo.periodic_uuid,
                                    is_delete: false,
                                })
                                .execute(),
                        );
                    }
                }

                await Promise.all(commands);
                await whiteboardBanRoom(roomInfo.whiteboard_room_uuid);
            },
        );

        return reply.send({
            status: Status.Success,
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        });
    }
};

interface StoppedBody {
    roomUUID: string;
}

export const stoppedSchemaType: FastifySchema<{
    body: StoppedBody;
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
