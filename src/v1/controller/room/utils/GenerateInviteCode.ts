import { customAlphabet } from "nanoid";
import RedisService from "../../../../thirdPartyService/RedisService";
import { Server } from "../../../../constants/Config";
import { RedisKey } from "../../../../utils/Redis";

const nanoID = customAlphabet("0123456789", 10);

const inviteCodeFn = (): string => {
    const value = nanoID();
    return `${Server.regionCode}`.concat(value);
};

export const generateInviteCode = async (): Promise<string | null> => {
    const keyList = [];

    // find the unused key
    for (let i = 0; i < 30; i++) {
        keyList.push(RedisKey.roomInviteCode(inviteCodeFn()));
    }

    const value = await RedisService.vacantKey(keyList);
    if (value === null) {
        return null;
    }

    return RedisKey.roomInviteCodeParse(value);
};
