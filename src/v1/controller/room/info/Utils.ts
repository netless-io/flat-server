import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { Logger, LoggerAPI } from "../../../../logger";

export const getInviteCode = async (
    roomUUID: string,
    logger: Logger<LoggerAPI>,
): Promise<string> => {
    try {
        return (await RedisService.get(RedisKey.roomInviteCodeReverse(roomUUID))) || roomUUID;
    } catch (error) {
        logger.warn("get invite code failed", error);
        return roomUUID;
    }
};
