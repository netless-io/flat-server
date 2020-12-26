import { getConnection } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { UTCDate } from "../../../../utils/Time";
import { RoomPeriodicModel } from "../../../model/room/RoomPeriodic";

export const updateDB = async (
    roomUUID: string,
    userUUID: string,
    updateStatus = false,
    periodicUUID = "",
): Promise<void> => {
    await getConnection().transaction(async t => {
        const commands: Promise<unknown>[] = [];

        // insert current user uuid to room_user table when room_user table not current user uuid
        commands.push(
            t
                .createQueryBuilder()
                .insert()
                .into(RoomUserModel)
                .orIgnore()
                .values({
                    room_uuid: roomUUID,
                    user_uuid: userUUID,
                    user_int_uuid: cryptoRandomString({ length: 10, type: "numeric" }),
                })
                .execute(),
        );

        if (updateStatus) {
            const beginTime = UTCDate();
            commands.push(
                t
                    .createQueryBuilder()
                    .update(RoomModel)
                    .set({
                        room_status: RoomStatus.Running,
                        begin_time: beginTime,
                    })
                    .where({
                        room_uuid: roomUUID,
                        is_delete: false,
                    })
                    .execute(),
            );

            if (periodicUUID !== "") {
                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomPeriodicConfigModel)
                        .set({
                            periodic_status: RoomStatus.Running,
                        })
                        .where({
                            periodic_uuid: periodicUUID,
                            periodic_status: RoomStatus.Pending,
                            is_delete: false,
                        })
                        .execute(),
                );

                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomPeriodicModel)
                        .set({
                            begin_time: beginTime,
                        })
                        .where({
                            fake_room_uuid: roomUUID,
                            is_delete: false,
                        })
                        .execute(),
                );
            }
        }

        return Promise.all(commands);
    });
};
