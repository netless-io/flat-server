import { In, Not } from "typeorm";
import { Status } from "../../../../constants/Project";
import { PeriodicStatus, RoomStatus } from "../../../../model/room/Constants";
import { createWhiteboardRoomToken } from "../../../../utils/NetlessToken";
import cryptoRandomString from "crypto-random-string";
import { ResponseType } from "./Type";
import { getRTCToken, getRTMToken } from "../../../utils/AgoraToken";
import { ErrorCode } from "../../../../ErrorCode";
import { Response } from "../../../../types/Server";
import {
    RoomDAO,
    RoomPeriodicConfigDAO,
    RoomPeriodicUserDAO,
    RoomUserDAO,
    UserDAO,
} from "../../../../dao";
import { showGuide } from "./Utils";
import { AGORA_SHARE_SCREEN_UID } from "../../../../constants/Agora";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { Server } from "../../../../constants/Config";

export const joinPeriodic = async (
    periodicUUID: string,
    userUUID: string,
): Promise<Response<ResponseType>> => {
    const periodicRoomConfig = await RoomPeriodicConfigDAO().findOne(
        ["periodic_status", "owner_uuid", "region"],
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
        [
            "title",
            "room_uuid",
            "whiteboard_room_uuid",
            "owner_uuid",
            "room_status",
            "room_type",
            "begin_time",
        ],
        {
            periodic_uuid: periodicUUID,
            room_status: Not(In([RoomStatus.Stopped])),
        },
    );

    // will arrive here in extreme cases, notify user to retry
    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.ServerFail,
        };
    }

    const { room_uuid: roomUUID, whiteboard_room_uuid: whiteboardRoomUUID } = roomInfo;

    const local = await UserDAO().findOne(["id"], {
        user_uuid: userUUID,
    });

    const wasOnList = await RoomPeriodicUserDAO().findOne(["id"], {
        periodic_uuid: periodicUUID,
        user_uuid: userUUID,
    });

    await dataSource.transaction(async t => {
        const commands: Promise<unknown>[] = [];

        commands.push(
            RoomUserDAO(t).insert(
                {
                    room_uuid: roomUUID,
                    user_uuid: userUUID,
                    rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
                },
                {
                    orUpdate: {
                        is_delete: false,
                    },
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
                    orUpdate: {
                        is_delete: false,
                    },
                },
            ),
        );

        return await Promise.all(commands);
    });

    if (roomInfo.begin_time.getTime() - Date.now() > Server.joinEarly * 60 * 1000) {
        const ownerInfo = await UserDAO().findOne(["user_name"], {
            user_uuid: roomInfo.owner_uuid,
        });

        return {
            status: Status.Failed,
            code: !local || wasOnList ? ErrorCode.RoomNotBegin : ErrorCode.RoomNotBeginAndAddList,
            message: `room(${roomUUID}) is not ready, it will start at ${roomInfo.begin_time.toISOString()}`,
            detail: {
                title: roomInfo.title,
                beginTime: roomInfo.begin_time.getTime(),
                uuid: roomInfo.room_uuid,
                ownerUUID: roomInfo.owner_uuid,
                ownerName: ownerInfo?.user_name,
            },
        };
    }

    const roomUserInfo = await RoomUserDAO().findOne(["rtc_uid"], {
        room_uuid: roomUUID,
        user_uuid: userUUID,
    });

    let rtcUID: string;
    if (roomUserInfo !== undefined) {
        rtcUID = roomUserInfo.rtc_uid;
    } else {
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
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
            rtcShareScreen: {
                uid: AGORA_SHARE_SCREEN_UID,
                token: await getRTCToken(roomUUID, AGORA_SHARE_SCREEN_UID),
            },
            rtmToken: await getRTMToken(userUUID),
            region: periodicRoomConfig.region,
            showGuide: roomInfo.owner_uuid === userUUID && (await showGuide(userUUID, roomUUID)),
        },
    };
};
