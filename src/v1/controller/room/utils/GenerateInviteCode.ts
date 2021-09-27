import { customAlphabet } from "nanoid";
import RedisService from "../../../../thirdPartyService/RedisService";

const nanoID = customAlphabet("0123456789", 10);

const inviteCodeFn = (): string => {
    const value = nanoID();

    // filter out the ids whose first number is 0
    if (value[0] === "0") {
        return inviteCodeFn();
    }

    return value;
};

export const generateInviteCode = async (): Promise<string | null> => {
    const inviteCodeList = [];

    // find the unused key
    for (let i = 0; i < 30; i++) {
        inviteCodeList.push(inviteCodeFn());
    }

    return await RedisService.vacantKey(inviteCodeList);
};
