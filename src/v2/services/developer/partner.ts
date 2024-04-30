import cryptoRandomString from "crypto-random-string";
import { EntityManager, In } from "typeorm";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { createLoggerService } from "../../../logger";
import { RoomStatus, RoomType } from "../../../model/room/Constants";
import { RoomModel } from "../../../model/room/Room";
import { generateRoomInviteCode, generateRoomUUID } from "../../../v1/controller/room/create/Utils";
import { rtcQueue } from "../../../v1/queue";
import { ServiceRoom } from "../../../v1/service";
import {
    partnerDAO,
    partnerRoomDAO,
    roomUserDAO,
    userDAO,
    userEmailDAO,
    userPhoneDAO,
} from "../../dao";
import { RoomAdminService } from "../room/admin";

export class DeveloperPartnerService {
    private readonly logger = createLoggerService<"developerPartner">({
        serviceName: "developerPartner",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly partnerUUID: string,
    ) {}

    async exists(): Promise<boolean> {
        const partner = await partnerDAO.findOne(this.DBTransaction, ["id"], {
            partner_uuid: this.partnerUUID,
        });

        return !!partner;
    }

    async assertExists(): Promise<void> {
        if (!(await this.exists())) {
            this.logger.error("partner not found", {
                developerPartner: {
                    partnerUUID: this.partnerUUID,
                },
            });

            throw new FError(ErrorCode.PartnerNotFound);
        }
    }

    async registerUser(phone_or_email: string): Promise<string | null> {
        await this.assertExists();

        const isEmail = phone_or_email.includes("@");
        if (isEmail) {
            const userEmail = await userEmailDAO.findOne(this.DBTransaction, ["user_uuid"], {
                user_email: phone_or_email,
            });
            return userEmail && userEmail.user_uuid;
        } else {
            const userPhone = await userPhoneDAO.findOne(this.DBTransaction, ["user_uuid"], {
                phone_number: phone_or_email,
            });
            return userPhone && userPhone.user_uuid;
        }
    }

    async createRoom(params: CreateRoomParams): Promise<{ roomUUID: string; inviteCode: string }> {
        await this.assertExists();

        const { userUUID, ownerUUID, title, type, beginTime, endTime } = params;

        const result = await userDAO.find(this.DBTransaction, ["user_uuid"], {
            user_uuid: In([userUUID, ownerUUID]),
        });
        if (result.length < 2) {
            const users = result.map(e => e.user_uuid);

            this.logger.error("user not found", {
                developerPartner: {
                    userUUID,
                    ownerUUID,
                    userMissing: !users.includes(userUUID),
                    ownerMissing: !users.includes(ownerUUID),
                },
            });

            throw new FError(ErrorCode.UserNotFound);
        }

        const roomUUID = generateRoomUUID();
        const roomService = new ServiceRoom(roomUUID, ownerUUID);

        await Promise.all([
            roomService.create({ title, type, beginTime, endTime }, this.DBTransaction),
            roomUserDAO.insert(this.DBTransaction, [
                {
                    room_uuid: roomUUID,
                    user_uuid: userUUID,
                    rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
                },
                {
                    room_uuid: roomUUID,
                    user_uuid: ownerUUID,
                    rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
                },
            ]),
            partnerRoomDAO.insert(this.DBTransaction, {
                partner_uuid: this.partnerUUID,
                room_uuid: roomUUID,
            }),
        ]);

        rtcQueue(roomUUID, 0);

        const inviteCode = await generateRoomInviteCode("ordinary", roomUUID, this.logger);

        return { roomUUID, inviteCode };
    }

    async removeRoom(roomUUID: string) {
        await this.assertExists();

        const result = await partnerRoomDAO.findOne(this.DBTransaction, ["id"], {
            partner_uuid: this.partnerUUID,
            room_uuid: roomUUID,
        });
        if (!result) {
            this.logger.error("room not found", {
                developerPartner: {
                    roomUUID,
                },
            });

            throw new FError(ErrorCode.RoomNotFound);
        }

        await new RoomAdminService(this.ids, this.DBTransaction).banRooms([roomUUID]);

        await partnerRoomDAO.delete(this.DBTransaction, {
            partner_uuid: this.partnerUUID,
            room_uuid: roomUUID,
        });
    }

    async listRooms(userUUID?: string): Promise<PartnerRoomInfo[]> {
        await this.assertExists();

        let query = this.DBTransaction.createQueryBuilder(RoomModel, "r")
            .innerJoin("partner_rooms", "pr", "pr.room_uuid = r.room_uuid")
            .addSelect("r.room_uuid", "roomUUID")
            .addSelect("r.title", "title")
            .addSelect("r.room_type", "roomType")
            .addSelect("r.room_status", "roomStatus")
            .addSelect("r.begin_time", "beginTime")
            .addSelect("r.end_time", "endTime")
            .where("r.is_delete = :isDelete", { isDelete: false })
            .andWhere("pr.is_delete = :isDelete", { isDelete: false })
            .andWhere("pr.partner_uuid = :partnerUUID", { partnerUUID: this.partnerUUID });

        if (userUUID) {
            query = query
                .innerJoin("room_users", "ru", "ru.room_uuid = r.room_uuid")
                .andWhere("ru.is_delete = :isDelete", { isDelete: false })
                .andWhere("ru.user_uuid = :userUUID", { userUUID });
        }

        type ReplaceDbTime<T> = {
            [P in keyof T]: P extends `${string}Time` ? Date : T[P];
        };

        const result: ReplaceDbTime<PartnerRoomInfo>[] = await query.getRawMany();

        return result.map(info => ({
            roomUUID: info.roomUUID,
            title: info.title,
            roomType: info.roomType,
            roomStatus: info.roomStatus,
            beginTime: info.beginTime.valueOf(),
            endTime: info.endTime.valueOf(),
        }));
    }
}

export interface CreateRoomParams {
    userUUID: string;
    ownerUUID: string;
    title: string;
    type: RoomType;
    beginTime: number;
    endTime: number;
}

export interface PartnerRoomInfo {
    roomUUID: string;
    title: string;
    roomType: RoomType;
    roomStatus: RoomStatus;
    beginTime: number;
    endTime: number;
}
