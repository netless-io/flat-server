import { customAlphabet } from "nanoid";
import RedisService from "../../../../thirdPartyService/RedisService";
import { Server } from "../../../../constants/Config";
import { RedisKey } from "../../../../utils/Redis";

const nanoID = customAlphabet("0123456789", 10);

const inviteCodeFnOrdinary = (): string => {
    const value = nanoID();

    // insert region code at front, this is only used for ordinary rooms.
    return `${Server.regionCode}`.concat(value);
};

export const generateInviteCodeOrdinary = async (): Promise<string | null> => {
    const keyList = [];

    // find the unused key
    for (let i = 0; i < 30; i++) {
        keyList.push(RedisKey.roomInviteCode(inviteCodeFnOrdinary()));
    }

    const value = await RedisService.vacantKey(keyList);
    if (value === null) {
        return null;
    }

    return RedisKey.roomInviteCodeParse(value);
};

const inviteCodeFnPeriodic = (): string => {
    const value = nanoID();

    // make sure the invite code not start with 0
    if (value[0] === "0") {
        return inviteCodeFnPeriodic();
    }

    return value;
};

export const generateInviteCodePeriodic = async (): Promise<string | null> => {
    const keyList = [];

    // find the unused key
    for (let i = 0; i < 30; i++) {
        keyList.push(RedisKey.roomInviteCode(inviteCodeFnPeriodic()));
    }

    const value = await RedisService.vacantKey(keyList);
    if (value === null) {
        return null;
    }

    return RedisKey.roomInviteCodeParse(value);
};
