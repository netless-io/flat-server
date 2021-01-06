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
import { ErrorCode } from "../../../../ErrorCode";

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
            code: ErrorCode.PeriodicNotFound,
        };
    }

    if (roomPeriodicConfig.periodic_status === RoomStatus.Stopped) {
        return {
            status: Status.Failed,
            code: ErrorCode.PeriodicIsEnded,
        };
    }

    const roomInfo = await getRepository(RoomModel)
        .createQueryBuilder()
        .select(["room_uuid", "whiteboard_room_uuid", "owner_uuid", "room_status", "room_type"])
        .where(
            `periodic_uuid = :periodicUUID
                AND room_status IN (:...roomStatus)
                AND is_delete = false`,
            {
                periodicUUID,
                roomStatus: [RoomStatus.Pending, RoomStatus.Running],
            },
        )
        .getRawOne<RoomModel>();

    // will arrive here in extreme cases, notify user to retry
    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.CanRetry,
        };
    }

    const { room_uuid: roomUUID, whiteboard_room_uuid: whiteboardRoomUUID } = roomInfo;
    const rtcUID = cryptoRandomString({ length: 10, type: "numeric" });

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
                    rtc_uid: rtcUID,
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
            roomType: roomInfo.room_type,
            roomUUID: roomUUID,
            whiteboardRoomToken: createWhiteboardRoomToken(whiteboardRoomUUID),
            whiteboardRoomUUID: whiteboardRoomUUID,
            rtcUID: Number(rtcUID),
            rtcToken: await getRTCToken(roomUUID, Number(rtcUID)),
            rtmToken: await getRTMToken(userUUID),
        },
    };
};
