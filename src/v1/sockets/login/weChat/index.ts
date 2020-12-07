import redisService from "../../../service/RedisService";
import { RedisKeyPrefix, Status, WeChatSocketEvents } from "../../../../Constants";
import { IOSocket, SocketValidationRules } from "../../../types/Server";

export const weChat = async (socket: IOSocket, data: AuthID): Promise<void> => {
    const { uuid } = data;

    const result = await redisService.set(`${RedisKeyPrefix.WX_AUTH_UUID}:${uuid}`, "0", 60 * 2);

    if (result === null) {
        socket.emit(WeChatSocketEvents.AuthID, {
            status: Status.Failed,
            message: `set redis key: ${uuid} failed`,
        });
    } else {
        socket.emit(WeChatSocketEvents.AuthID, {
            status: Status.Success,
        });
    }
};

interface AuthID {
    uuid: string;
}

export const weChatValidationRules: SocketValidationRules = ["uuid"];
