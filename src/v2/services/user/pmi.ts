import { customAlphabet } from "nanoid";
import { EntityManager, In, Not } from "typeorm";
import { RoomStatus } from "../../../model/room/Constants";
import { Server } from "../../../constants/Config";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { createLoggerService } from "../../../logger";
import RedisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../utils/Redis";
import { roomDAO, userPmiDAO } from "../../dao";

const nanoID = customAlphabet("0123456789", 10);

export class UserPmiService {
    private readonly logger = createLoggerService<"userPmi">({
        serviceName: "userPmi",
        ids: this.ids,
    });

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async get(): Promise<string | null> {
        const result = await userPmiDAO.findOne(this.DBTransaction, ["pmi"], {
            user_uuid: this.userUUID,
        });

        if (!result) {
            this.logger.info("user pmi not found", {
                userPmi: {
                    userUUID: this.userUUID,
                },
            });
            return null;
        }

        return result.pmi;
    }

    public async getOrCreate(): Promise<string> {
        const result = await userPmiDAO.findOne(this.DBTransaction, ["pmi"], {
            user_uuid: this.userUUID,
        });
        if (result) {
            return result.pmi;
        }

        const pmi = await this.generatePmi();
        if (pmi) {
            await userPmiDAO.insert(this.DBTransaction, {
                user_uuid: this.userUUID,
                pmi,
            });
            return pmi;
        } else {
            throw new FError(ErrorCode.UserPmiDrained);
        }
    }

    private async generatePmi(): Promise<string | undefined> {
        const keyList = Array.from({ length: 30 }, () => `${Server.regionCode}${nanoID()}`);

        const unused = await RedisService.vacantKeys(keyList.map(RedisKey.roomInviteCode));
        const unusedKeyList = unused.map(RedisKey.roomInviteCodeParse);

        const used = await userPmiDAO.find(this.DBTransaction, ["pmi"], { pmi: In(unusedKeyList) });
        const usedSet = new Set(used.map(item => item.pmi));

        for (const key of unusedKeyList) {
            if (!usedSet.has(key)) {
                return key;
            }
        }

        this.logger.info("user pmi drained", {
            userPmi: {
                userUUID: this.userUUID,
            },
        });
        return;
    }

    public async exist(pmi: string): Promise<boolean> {
        const result = await userPmiDAO.findOne(this.DBTransaction, ["id"], { pmi });

        return Boolean(result);
    }

    public async listRooms(): Promise<UserPmiListRoomsReturn> {
        const pmi = await this.get();
        if (!pmi) return [];

        const uuid = await RedisService.get(RedisKey.roomInviteCode(pmi));
        if (!uuid) return [];

        this.logger.debug(`(pmi) invite code: ${pmi} , roomUUID: ${uuid}`);

        const room = await roomDAO.findOne(this.DBTransaction, ["room_uuid"], {
            room_uuid: uuid,
            periodic_uuid: "",
            room_status: Not(RoomStatus.Stopped),
        });
        if (!room) {
            // No room, but redis has the key, which is wrong.
            // Delete the redis key to restore the PMI availability.
            await RedisService.del([
                RedisKey.roomInviteCode(pmi),
                RedisKey.roomInviteCodeReverse(uuid),
            ]);
        }

        return room ? [{ roomUUID: room.room_uuid }] : [];
    }
}

export type UserPmiListRoomsReturn = Array<{ roomUUID: string }>;
