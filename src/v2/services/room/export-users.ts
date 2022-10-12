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
import { roomDAO } from "../../dao";

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

        const users = await this.getUsersByRoomUUID(roomUUID);

        return {
            roomEndDate: room.roomEndDate,
            roomStartDate: room.roomStartDate,
            ownerName: room.ownerName,
            roomTitle: room.roomTitle,
            users,
        };
    }

    private async getUsersByRoomUUID(roomUUID: string): Promise<RoomExportUserItem[]> {
        const db = this.DBTransaction.createQueryBuilder(RoomUserModel, "ru")
            .innerJoin(UserModel, "u", "ru.user_uuid = u.user_uuid")
            .addSelect("u.user_name", "userName")
            .addSelect("ru.created_at", "joinRoomDate");

        if (RoomExportUsersService.phoneSMSEnabled) {
            db.innerJoin(UserPhoneModel, "up", "ru.user_uuid = up.user_uuid")
                .addSelect("up.phone_number", "userPhone")
                .andWhere("up.is_delete = :isDelete", { isDelete: false });
        }

        const roomUsers = await db
            .andWhere("ru.room_uuid = :roomUUID", { roomUUID })
            .andWhere("ru.is_delete = :isDelete", { isDelete: false })
            .andWhere("u.is_delete = :isDelete", { isDelete: false })
            .orderBy("ru.created_at", "ASC")
            .getRawMany<Omit<RoomExportUserItem, "joinRoomDate"> & { joinRoomDate: Date }>();

        const r = roomUsers.map(({ userName, joinRoomDate, userPhone }) => ({
            userName,
            joinRoomDate: joinRoomDate.valueOf(),
            userPhone: RoomExportUsersService.phoneSMSEnabled ? userPhone : undefined,
        }));

        return r;
    }

    private async getRoomInfoIncludeOwnerName(roomUUID: string): Promise<RoomInfoWithOwnerName> {
        const roomInfo = await this.DBTransaction.createQueryBuilder(RoomModel, "r")
            .innerJoin(UserModel, "u", "u.user_uuid = r.owner_uuid")
            .addSelect("r.room_uuid", "roomUUID")
            .addSelect("r.title", "roomTitle")
            .addSelect("r.begin_time", "roomStartDate")
            .addSelect("r.end_time", "roomEndDate")
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
            this.logger.info("room not found", {
                roomExportUsers: {
                    userUUID: this.userUUID,
                    roomUUID: roomUUID,
                },
            });
            throw new FError(ErrorCode.RoomNotFound);
        }

        const { roomStartDate, roomEndDate, ...rest } = roomInfo;
        return {
            ...rest,
            roomStartDate: roomStartDate.valueOf(),
            roomEndDate: roomEndDate.valueOf(),
        };
    }

    public static get phoneSMSEnabled(): boolean {
        return PhoneSMS.enable;
    }

    public async assertRoomOwner(roomUUID: string): Promise<void> {
        const result = await roomDAO.findOne(this.DBTransaction, "id", {
            room_uuid: roomUUID,
            owner_uuid: this.userUUID,
        });
        if (!result.id) {
            this.logger.info("room not found", {
                roomExportUsers: {
                    roomUUID,
                    userUUID: this.userUUID,
                },
            });
            throw new FError(ErrorCode.RoomNotFound);
        }
    }
}
