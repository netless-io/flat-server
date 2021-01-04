import { getConnection, getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomStatus } from "../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";
import { RoomPeriodicUserModel } from "../../../model/room/RoomPeriodicUser";
import { Result } from "./Type";
import { getRTCToken, getRTMToken } from "../../../utils/AgoraToken";

export const joinPeriodic = async (periodicUUID: string, userUUID: string): Promise<Result> => {
    const roomPeriodicConfig = await getRepository(RoomPeriodicConfigModel).findOne({
        select: ["periodic_status"],
        where: {
            periodic_uuid: periodicUUID,
            is_delete: false,
        },
    });

    if (roomPeriodicConfig === undefined) {
        return {
            status: Status.Failed,
            message: "Periodic room not found",
        };
    }

    if (roomPeriodicConfig.periodic_status === RoomStatus.Stopped) {
        return {
            status: Status.Failed,
            message: "Periodic has been ended",
        };
    }

    const roomInfo = await getRepository(RoomModel)
        .createQueryBuilder()
        .select(["room_uuid", "whiteboard_room_uuid", "owner_uuid", "room_status"])
        .where(
            `periodic_uuid = :periodicUUID
                AND room_status IN (:...roomStatus)
                AND is_delete = false`,
            {
                periodicUUID,
                roomStatus: [RoomStatus.Pending, RoomStatus.Running],
            },
        )
        .getRawOne();

    // will arrive here in extreme cases, notify user to retry
    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            message: "Room has ended or been deleted",
        };
    }

    const { room_uuid: roomUUID, whiteboard_room_uuid: whiteboardRoomUUID } = roomInfo;
    const userIntUUID = cryptoRandomString({ length: 10, type: "numeric" });

    await getConnection().transaction(async t => {
        const commands: Promise<unknown>[] = [];

        commands.push(
            t
                .createQueryBuilder()
                .insert()
                .into(RoomUserModel)
                .orIgnore()
                .values({
                    room_uuid: roomUUID,
                    user_uuid: userUUID,
                    user_int_uuid: userIntUUID,
                })
                .execute(),
        );

        commands.push(
            t
                .createQueryBuilder()
                .insert()
                .into(RoomPeriodicUserModel)
                .orIgnore()
                .values({
                    periodic_uuid: periodicUUID,
                    user_uuid: userUUID,
                })
                .execute(),
        );

        return await Promise.all(commands);
    });

    return {
        status: Status.Success,
        data: {
            roomUUID: roomUUID,
            whiteboardRoomToken: createWhiteboardRoomToken(whiteboardRoomUUID),
            whiteboardRoomUUID: whiteboardRoomUUID,
            rtcToken: await getRTCToken(roomUUID, Number(userIntUUID)),
            rtmToken: await getRTMToken(userUUID),
        },
    };
};
