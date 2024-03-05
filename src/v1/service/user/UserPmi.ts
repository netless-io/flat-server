import RedisService from "../../../thirdPartyService/RedisService";
import { customAlphabet } from "nanoid";
import { EntityManager, In, Not } from "typeorm";
import { Server } from "../../../constants/Config";
import { RoomDAO, UserPmiDAO } from "../../../dao";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { RedisKey } from "../../../utils/Redis";
import { RoomStatus } from "../../../model/room/Constants";

const nanoID = customAlphabet("0123456789", 10);

export class ServiceUserPmi {
    constructor(private readonly userUUID: string) {}

    public async getOrCreate(t?: EntityManager): Promise<string> {
        const result = await UserPmiDAO(t).findOne(["pmi"], {
            user_uuid: this.userUUID,
        });
        if (result) {
            return result.pmi;
        }

        const pmi = await this.generatePmi(t);
        if (pmi) {
            await UserPmiDAO(t).insert({
                user_uuid: this.userUUID,
                pmi,
            });
            return pmi;
        } else {
            throw new ControllerError(ErrorCode.UserPmiDrained);
        }
    }

    private async generatePmi(t?: EntityManager): Promise<string | undefined> {
        const keyList = Array.from({ length: 30 }, () => `${Server.regionCode}${nanoID()}`);

        const unused = await RedisService.vacantKeys(keyList.map(RedisKey.roomInviteCode));
        const unusedKeyList = unused.map(RedisKey.roomInviteCodeParse);

        const used = await UserPmiDAO(t).find(["pmi"], { pmi: In(unusedKeyList) });
        const usedSet = new Set(used.map(item => item.pmi));

        for (const key of unusedKeyList) {
            if (!usedSet.has(key)) {
                return key;
            }
        }

        return;
    }

    public async existsRoom(t?: EntityManager): Promise<boolean> {
        const user = await UserPmiDAO(t).findOne(["pmi"], {
            user_uuid: this.userUUID,
        });
        if (!user) {
            return false;
        }

        const { pmi } = user;
        const uuid = await RedisService.get(RedisKey.roomInviteCode(pmi));
        if (!uuid) {
            return false;
        }

        const room = await RoomDAO(t).findOne(["room_uuid"], {
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

        return Boolean(room);
    }
}
