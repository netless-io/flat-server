import redisService from "../../../service/RedisService";
import { RedisKeyPrefix, Status, WeChatSocketEvents } from "../../../../Constants";
import { IOSocket } from "../../../types/Server";
import { JSONSchemaType } from "ajv/dist/types/json-schema";

export const weChat = async (socket: IOSocket, data: AuthID): Promise<void> => {
    const { uuid } = data;

    const result = await redisService.set(
        `${RedisKeyPrefix.WECHAT_AUTH_UUID}:${uuid}`,
        "0",
        60 * 2,
    );

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

export const weChatSchemaType: JSONSchemaType<AuthID> = {
    type: "object",
    required: ["uuid"],
    properties: {
        uuid: {
            type: "string",
        },
    },
};
