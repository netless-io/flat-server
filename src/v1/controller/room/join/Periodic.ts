import { getConnection, In, Not } from "typeorm";
import { Status } from "../../../../Constants";
import { PeriodicStatus, RoomStatus } from "../Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import cryptoRandomString from "crypto-random-string";
import { JoinResponse } from "./Type";
import { getRTCToken, getRTMToken } from "../../../utils/AgoraToken";
import { ErrorCode } from "../../../../ErrorCode";
import { Response } from "../../../types/Server";
import { RoomDAO, RoomPeriodicConfigDAO, RoomPeriodicUserDAO, RoomUserDAO } from "../../../dao";

export const joinPeriodic = async (
    periodicUUID: string,
    userUUID: string,
): Response<JoinResponse> => {
    const periodicRoomConfig = await RoomPeriodicConfigDAO().findOne(
        ["periodic_status", "owner_uuid"],
        {
            periodic_uuid: periodicUUID,
        },
    );

    if (periodicRoomConfig === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.PeriodicNotFound,
        };
    }

    if (periodicRoomConfig.periodic_status === PeriodicStatus.Stopped) {
        return {
            status: Status.Failed,
            code: ErrorCode.PeriodicIsEnded,
        };
    }

    const roomInfo = await RoomDAO().findOne(
        ["room_uuid", "whiteboard_room_uuid", "owner_uuid", "room_status", "room_type"],
        {
            periodic_uuid: periodicUUID,
            room_status: Not(In([RoomStatus.Stopped])),
        },
    );

    // will arrive here in extreme cases, notify user to retry
    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.CanRetry,
        };
    }

    const { room_uuid: roomUUID, whiteboard_room_uuid: whiteboardRoomUUID } = roomInfo;
    let rtcUID: string;

    if (periodicRoomConfig.owner_uuid === userUUID) {
        const roomUserInfo = await RoomUserDAO().findOne(["rtc_uid"], {
            room_uuid: roomUUID,
            user_uuid: userUUID,
        });

        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.CanRetry,
            };
        }

        rtcUID = roomUserInfo.rtc_uid;
    } else {
        rtcUID = cryptoRandomString({ length: 6, type: "numeric" });

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomUserDAO(t).insert(
                    {
                        room_uuid: roomUUID,
                        user_uuid: userUUID,
                        rtc_uid: rtcUID,
                    },
                    {
                        is_delete: false,
                    },
                ),
            );

            commands.push(
                RoomPeriodicUserDAO(t).insert(
                    {
                        periodic_uuid: periodicUUID,
                        user_uuid: userUUID,
                    },
                    {
                        is_delete: false,
                    },
                ),
            );

            return await Promise.all(commands);
        });
    }

    return {
        status: Status.Success,
        data: {
            roomType: roomInfo.room_type,
            roomUUID: roomUUID,
            ownerUUID: roomInfo.owner_uuid,
            whiteboardRoomToken: createWhiteboardRoomToken(whiteboardRoomUUID),
            whiteboardRoomUUID: whiteboardRoomUUID,
            rtcUID: Number(rtcUID),
            rtcToken: await getRTCToken(roomUUID, Number(rtcUID)),
            rtmToken: await getRTMToken(userUUID),
        },
    };
};
