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
            .set(RedisKey.roomInviteCode(inviteCode), roomUUID, "EX", fiftyDays)
            .set(RedisKey.roomInviteCodeReverse(roomUUID), inviteCode, "EX", fiftyDays)
            .exec()
            .then(data => {
                for (let i = 0; i < data.length; i++) {
                    const error = data[i][0];
                    if (error !== null) {
                        throw error;
                    }
                }
            })
            .catch(error => {
                logger.warn("set room invite code to redis failed", parseError(error));
            });
    }

    return inviteCode;
};
