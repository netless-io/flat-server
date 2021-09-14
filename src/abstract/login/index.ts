import redisService from "../../thirdPartyService/RedisService";
import { RedisKey } from "../../utils/Redis";
import { LoginClassParams } from "./Type";
import { ErrorCode } from "../../ErrorCode";
import { ControllerError } from "../../error/ControllerError";
import { Logger, LoggerAPI } from "../../logger";

export abstract class AbstractLogin {
    protected readonly userUUID: string;

    protected constructor(params: LoginClassParams) {
        this.userUUID = params.userUUID;
    }

    public abstract register(info: any): Promise<void>;

    public static async assertHasAuthUUID(
        authUUID: string,
        logger: Logger<LoggerAPI>,
    ): Promise<void> {
        const result = await redisService.get(RedisKey.authUUID(authUUID));

        if (result === null) {
            logger.warn("uuid verification failed");
            throw new ControllerError(ErrorCode.ParamsCheckFailed);
        }
    }

    public async tempSaveUserInfo(
        authUUID: string,
        userInfo: Omit<UserInfo, "userUUID">,
    ): Promise<void> {
        const { name, avatar, token } = userInfo;

        await redisService.set(
            RedisKey.authUserInfo(authUUID),
            JSON.stringify({
                name,
                avatar,
                userUUID: this.userUUID,
                token,
            }),
            60 * 60,
        );
    }
}

interface UserInfo {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
}
