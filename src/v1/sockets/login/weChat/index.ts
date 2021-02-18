import redisService from "../../../thirdPartyService/RedisService";
import { Status, WeChatSocketEvents } from "../../../../Constants";
import { IOSocket } from "../../../types/Server";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import { RedisKey } from "../../../../utils/Redis";
import { ErrorCode } from "../../../../ErrorCode";

export const weChat = async (socket: IOSocket, data: AuthID): Promise<void> => {
    const { uuid } = data;

    const result = await redisService.set(RedisKey.weChatAuthUUID(uuid), "0", 60 * 60);

    if (result === null) {
        console.error(`set redis key: ${uuid} failed`);
        socket.emit(WeChatSocketEvents.AuthID, {
            status: Status.Failed,
            code: ErrorCode.ServerFail,
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
