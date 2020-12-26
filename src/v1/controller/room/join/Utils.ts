import { getConnection } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { RoomCyclicalConfigModel } from "../../../model/room/RoomCyclicalConfig";
import { UTCDate } from "../../../../utils/Time";

export const updateDB = async (
    roomUUID: string,
    userUUID: string,
    updateStatus = false,
    cyclicalUUID = "",
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
            commands.push(
                t
                    .createQueryBuilder()
                    .update(RoomModel)
                    .set({
                        room_status: RoomStatus.Running,
                        begin_time: UTCDate(),
                    })
                    .where({
                        room_uuid: roomUUID,
                        is_delete: false,
                    })
                    .execute(),
            );

            if (cyclicalUUID !== "") {
                commands.push(
                    t
                        .createQueryBuilder()
                        .update(RoomCyclicalConfigModel)
                        .set({
                            cyclical_status: RoomStatus.Running,
                        })
                        .where({
                            cyclical_uuid: cyclicalUUID,
                            cyclical_status: RoomStatus.Pending,
                            is_delete: false,
                        })
                        .execute(),
                );
            }
        }

        return Promise.all(commands);
    });
};
