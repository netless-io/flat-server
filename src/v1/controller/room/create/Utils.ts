import { Logger, LoggerAPI, parseError } from "../../../../logger";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { generateInviteCode } from "../utils/GenerateInviteCode";

export const generateRoomInviteCode = async (
    roomUUID: string,
    logger: Logger<LoggerAPI>,
): Promise<string> => {
    let inviteCode = "";
    try {
        // when invite code is used up, fallback to uuid
        inviteCode = (await generateInviteCode()) || roomUUID;
    } catch (error) {
        logger.warn("generate invite code failed", parseError(error));
        inviteCode = roomUUID;
    }

    if (inviteCode !== roomUUID) {
        const fiftyDays = 60 * 60 * 24 * 50;

        await RedisService.client
            .multi()
            .set(RedisKey.roomInviteCode(inviteCode), roomUUID, "EX", fiftyDays, "NX")
            .set(RedisKey.roomInviteCodeReverse(roomUUID), inviteCode, "EX", fiftyDays, "NX")
            .exec()
            .then(data => {
                for (let i = 0; i < data.length; i++) {
                    const [error, result] = data[i];

                    if (error !== null || result === null) {
                        throw error || new Error(`already exists redis key, failed index: ${i}`);
                    }
                }
            })
            .catch(error => {
                inviteCode = roomUUID;
                logger.warn("set room invite code to redis failed", parseError(error));
            });
    }

    return inviteCode;
};
