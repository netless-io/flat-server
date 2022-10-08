import { PhoneSMS } from "../../../constants/Config";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { RoomModel } from "../../../model/room/Room";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { UserPhoneModel } from "../../../model/user/Phone";
import { UserModel } from "../../../model/user/User";
import { EntityManager } from "typeorm";
import { createLoggerService } from "../../../logger";
import {
    RoomExportUserItem,
    RoomExportUsersReturn,
    RoomInfoWithOwnerName,
} from "./export-users.type";

export class RoomExportUsersService {
    private readonly logger = createLoggerService<"roomExportUsers">({
        serviceName: "roomExportUsers",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async roomAndUsersIncludePhone(roomUUID: string): Promise<RoomExportUsersReturn> {
        const room = await this.getRoomInfoIncludeOwnerName(roomUUID);
        if (!room) {
            this.logger.info("room not found", {
                roomExportUsers: {
                    userUUID: this.userUUID,
                    roomUUID: roomUUID,
                },
            });
            throw new FError(ErrorCode.RoomNotFound);
        }

        if (room.ownerUUID !== this.userUUID) {
            this.logger.info("insufficient permissions,user is not room's owner", {
                roomExportUsers: {
                    userUUID: this.userUUID,
                    roomUUID: roomUUID,
                    roomOwnerUUID: room.ownerUUID,
                },
            });
            throw new FError(ErrorCode.NotPermission);
        }

        const users = await this.getUsersByRoomUUID(roomUUID, this.phoneSMSEnabled);

        return {
            roomEndDate: room.roomEndDate,
            roomStartDate: room.roomStartDate,
            ownerName: room.ownerName,
            roomTitle: room.roomTitle,
            users: users,
        };
    }

    private async getUsersByRoomUUID(
        roomUUID: string,
        includePhoneNumber: boolean,
    ): Promise<RoomExportUserItem[]> {
        const db = this.DBTransaction.createQueryBuilder(RoomUserModel, "ru")
            .innerJoin(UserModel, "u", "ru.user_uuid = u.user_uuid")
            .addSelect("u.user_name", "userName")
            .addSelect("ru.created_at", "joinRoomDate");

        if (includePhoneNumber) {
            db.innerJoin(UserPhoneModel, "up", "ru.user_uuid = up.user_uuid").addSelect(
                "up.phone_number",
                "userPhone",
            );
        }

        const roomUsers = await db
            .where("ru.room_uuid = :roomUUID", { roomUUID })
            .andWhere("ru.is_delete = :isDelete", { isDelete: false })
            .andWhere("u.is_delete = :isDelete", { isDelete: false })
            .getRawMany<Omit<RoomExportUserItem, "joinRoomDate"> & { joinRoomDate: Date }>();

        const r = roomUsers.map(({ userName, joinRoomDate, userPhone }) => ({
            userName,
            joinRoomDate: joinRoomDate.valueOf(),
            userPhone: includePhoneNumber ? userPhone : "0",
        }));

        return r;
    }

    private async getRoomInfoIncludeOwnerName(
        roomUUID: string,
    ): Promise<RoomInfoWithOwnerName | undefined> {
        const roomInfo = await this.DBTransaction.createQueryBuilder(RoomModel, "r")
            .innerJoin(UserModel, "u", "u.user_uuid = r.owner_uuid")
            .addSelect("r.room_uuid", "roomUUID")
            .addSelect("r.title", "roomTitle")
            .addSelect("r.begin_time", "roomStartDate")
            .addSelect("r.end_time", "roomEndDate")
            .addSelect("r.owner_uuid", "ownerUUID")
            .addSelect("u.user_name", "ownerName")
            .where("r.room_uuid = :roomUUID", { roomUUID })
            .andWhere("r.is_delete = :isDelete", { isDelete: false })
            .andWhere("u.is_delete = :isDelete", { isDelete: false })
            .getRawOne<
                Omit<RoomInfoWithOwnerName, "roomStartDate" | "roomEndDate"> & {
                    roomStartDate: Date;
                    roomEndDate: Date;
                }
            >();

        if (!roomInfo) {
            return roomInfo;
        }

        const { roomStartDate, roomEndDate, ...rest } = roomInfo;
        return {
            ...rest,
            roomStartDate: roomStartDate.valueOf(),
            roomEndDate: roomEndDate.valueOf(),
        };
    }

    private get phoneSMSEnabled(): boolean {
        return PhoneSMS.enable;
    }
}
