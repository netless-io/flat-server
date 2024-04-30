import RedisService from "../../../thirdPartyService/RedisService";

import { EntityManager, Not, In } from "typeorm";
import { Region } from "../../../constants/Project";
import { createLoggerService, parseError } from "../../../logger";
import { PeriodicStatus, RoomStatus } from "../../../model/room/Constants";
import { RedisKey } from "../../../utils/Redis";
import { readyRecycleInviteCode } from "../../../v1/controller/room/updateStatus/Stopped";
import { roomIsIdle, roomIsRunning } from "../../../v1/controller/room/utils/RoomStatus";
import { rtcQueue } from "../../../v1/queue";
import { getNextPeriodicRoomInfo, updateNextPeriodicRoomInfo } from "../../../v1/service/Periodic";
import { whiteboardBanRoom } from "../../../v1/utils/request/whiteboard/WhiteboardRequest";
import { roomDAO, roomPeriodicConfigDAO, roomPeriodicDAO } from "../../dao";
import { getRTMToken } from "../../../v1/utils/AgoraToken";
import { agoraSendChannelMessage } from "../../../v1/utils/request/agora/RTM";

export class RoomAdminService {
    private readonly logger = createLoggerService<"roomAdmin">({
        serviceName: "roomAdmin",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
    ) {}

    public async banRooms(roomUUIDs: string[]): Promise<void> {
        const roomInfo = await roomDAO.find(
            this.DBTransaction,
            [
                "room_uuid",
                "room_status",
                "owner_uuid",
                "periodic_uuid",
                "whiteboard_room_uuid",
                "region",
            ],
            { room_uuid: In(roomUUIDs) },
        );

        const runningRooms = roomInfo.filter(
            room => roomIsIdle(room.room_status) || roomIsRunning(room.room_status),
        );
        if (runningRooms.length === 0) return;

        roomUUIDs = runningRooms.map(room => room.room_uuid);

        const commands: Promise<unknown>[] = [];

        const endTime = new Date();

        // 1. Stop running rooms
        commands.push(
            roomDAO.update(
                this.DBTransaction,
                { room_status: RoomStatus.Stopped, end_time: endTime },
                { room_uuid: In(roomUUIDs) },
            ),
        );

        // 2. Make next periodic rooms
        const periodicRoomInfo = new Map<string, { ownerUUID: string; region: Region }>();
        for (const { periodic_uuid, owner_uuid, region } of runningRooms) {
            if (periodic_uuid) {
                periodicRoomInfo.set(periodic_uuid, { ownerUUID: owner_uuid, region });
            }
        }

        const periodicUUIDs = runningRooms.map(room => room.periodic_uuid).filter(Boolean);
        const periodicRooms =
            periodicUUIDs.length > 0
                ? await roomPeriodicDAO.find(this.DBTransaction, ["periodic_uuid", "begin_time"], {
                      periodic_uuid: In(periodicUUIDs),
                      fake_room_uuid: In(roomUUIDs),
                  })
                : [];

        // New rooms because of closing previous periodic rooms
        const nextRoomUUIDs: string[] = [];
        // Stopped rooms
        const needRecycleInviteCode: string[] = [];

        if (periodicRooms.length > 0) {
            // 2.1. Stop fake rooms in database
            commands.push(
                roomPeriodicDAO.update(
                    this.DBTransaction,
                    { room_status: RoomStatus.Stopped, end_time: endTime },
                    { fake_room_uuid: In(roomUUIDs) },
                ),
            );

            // TODO: performance
            for (const { periodic_uuid, begin_time } of periodicRooms) {
                const nextPeriodicRoomInfo = await getNextPeriodicRoomInfo(
                    periodic_uuid,
                    begin_time,
                );
                if (nextPeriodicRoomInfo) {
                    nextRoomUUIDs.push(nextPeriodicRoomInfo.fake_room_uuid);
                    const periodicRoomConfig = await roomPeriodicConfigDAO.findOne(
                        this.DBTransaction,
                        ["title", "room_type"],
                        { periodic_uuid },
                    );
                    const info = periodicRoomInfo.get(periodic_uuid);
                    if (periodicRoomConfig && info) {
                        const { title, room_type } = periodicRoomConfig;
                        // 2.2. Create next room and transfer users
                        commands.push(
                            ...(await updateNextPeriodicRoomInfo({
                                transaction: this.DBTransaction,
                                periodic_uuid,
                                user_uuid: info.ownerUUID,
                                title,
                                room_type,
                                region: info.region,
                                ...nextPeriodicRoomInfo,
                            })),
                        );
                    }
                } else {
                    needRecycleInviteCode.push(periodic_uuid);
                }
            }

            // 2.3 Now `needRecycleInviteCode` only includes stopped PERIODIC rooms
            // Stop them in the config database
            if (needRecycleInviteCode.length > 0) {
                commands.push(
                    roomPeriodicConfigDAO.update(
                        this.DBTransaction,
                        { periodic_status: PeriodicStatus.Stopped },
                        { periodic_uuid: In(needRecycleInviteCode.slice()) },
                    ),
                );
            }
        }

        // Add stopped NORMAL rooms to `needRecycleInviteCode` too
        for (const room of runningRooms) {
            if (room.periodic_uuid) continue;
            needRecycleInviteCode.push(room.room_uuid);
        }

        await Promise.all(commands);

        // 4. Ban whiteboard room
        for (const { region, whiteboard_room_uuid } of runningRooms) {
            whiteboardBanRoom(region, whiteboard_room_uuid).catch(error => {
                this.logger.warn("ban room failed!", parseError(error));
            });
        }

        // 5. Recycle invite code for stopped rooms
        for (const roomUUID of needRecycleInviteCode) {
            readyRecycleInviteCode(roomUUID);
        }

        // 6. Start observing new rooms
        for (const nextRoomUUID of nextRoomUUIDs) {
            rtcQueue(nextRoomUUID);
        }
    }

    public async roomsInfo(UUIDs: string[]): Promise<RoomsInfo> {
        const result: Record<string, Partial<RoomInfo>> = {};
        const uuidKeyMap: Record<string, string> = {};

        // Prepare to search long uuid from redis
        const inviteCodes: string[] = [];
        for (const uuid of UUIDs) {
            result[uuid] = {};
            uuidKeyMap[uuid] = uuid;
            if (this.isInviteCode(uuid)) {
                inviteCodes.push(uuid);
            } else {
                result[uuid].roomUUID = uuid;
            }
        }

        if (inviteCodes.length > 0) {
            try {
                const roomUUIDs = await RedisService.mget(inviteCodes.map(RedisKey.roomInviteCode));
                for (let index = inviteCodes.length - 1; index >= 0; --index) {
                    const uuid = inviteCodes[index];
                    const roomUUID = roomUUIDs[index];
                    if (roomUUID) {
                        result[uuid].roomUUID = roomUUID;
                        uuidKeyMap[roomUUID] = uuid;
                    }
                }
            } catch (error) {
                this.logger.error("get room uuid by invite code failed", parseError(error));
            }
        }

        const roomUUIDs = Object.values(result)
            .map(room => room.roomUUID)
            .filter(Boolean) as string[];

        const ordinaryRooms = await roomDAO.find(
            this.DBTransaction,
            ["room_uuid", "periodic_uuid", "owner_uuid", "room_status", "begin_time"],
            { room_uuid: In(roomUUIDs), room_status: Not(In([RoomStatus.Stopped])) },
        );

        for (const room of ordinaryRooms) {
            const key = uuidKeyMap[room.room_uuid];
            const ret = result[key];
            if (ret) {
                ret.roomUUID = room.room_uuid;
                ret.periodicUUID = room.periodic_uuid;
                ret.ownerUUID = room.owner_uuid;
                ret.roomStatus = room.room_status;
                ret.beginTime = room.begin_time.valueOf();
            }
        }

        const periodicRooms = await roomDAO.find(
            this.DBTransaction,
            ["room_uuid", "periodic_uuid", "owner_uuid", "room_status", "begin_time"],
            { periodic_uuid: In(roomUUIDs), room_status: Not(In([RoomStatus.Stopped])) },
        );

        for (const room of periodicRooms) {
            const key = uuidKeyMap[room.periodic_uuid];
            const ret = result[key];
            if (ret) {
                ret.roomUUID = room.room_uuid;
                ret.periodicUUID = room.periodic_uuid;
                ret.ownerUUID = room.owner_uuid;
                ret.roomStatus = room.room_status;
                ret.beginTime = room.begin_time.valueOf();
            }
        }

        // Clean not found rooms
        for (const uuid of UUIDs) {
            if (!result[uuid].roomStatus) {
                delete result[uuid];
            }
        }

        return result as RoomsInfo;
    }

    public async roomMessages(messages: { roomUUID: string; message: string }[]): Promise<void> {
        const agoraUID = "flat-server";
        const agoraToken = await getRTMToken(agoraUID);
        for (const { roomUUID, message } of messages) {
            try {
                const response = await agoraSendChannelMessage(
                    agoraUID,
                    agoraToken,
                    roomUUID,
                    message,
                );
                if (response.result !== "success") {
                    this.logger.warn("send rtm message " + response.result, {
                        errorMessage: [response.request_id, roomUUID, message].join(":"),
                    });
                }
            } catch (error) {
                this.logger.warn("failed to send rtm message", parseError(error));
            }
        }
    }

    public async online(roomUUID: string, userUUID: string): Promise<void> {
        const oneDay = 60 * 60 * 24;
        await RedisService.zadd(RedisKey.online(roomUUID), userUUID, Date.now(), oneDay);
    }

    private isInviteCode(uuid: string): boolean {
        return /^\d{10,11}$/.test(uuid);
    }
}

export interface RoomInfo {
    roomUUID: string;
    periodicUUID: string;
    ownerUUID: string;
    roomStatus: RoomStatus;
    beginTime: number;
}

export interface RoomsInfo {
    [uuid: string]: RoomInfo;
}
