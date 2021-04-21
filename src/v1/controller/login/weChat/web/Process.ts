import { PatchRequest, Response } from "../../../../types/Server";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import { AuthValue } from "../Constants";

export const wechatLoginProcess = async (
    req: PatchRequest<{
        Body: WechatLoginProcessBody;
    }>,
): Response<WechatLoginProcessResponse> => {
    const { authID } = req.body;

    const result = await redisService.get(RedisKey.weChatAuthUUID(authID));

    const defaultResponse = {
        name: "",
        avatar: "",
        userUUID: "",
        token: "",
    };

    if (result === null || result === AuthValue.Process) {
        return {
            status: Status.Success,
            data: defaultResponse,
        };
    }

    if (
        [
            AuthValue.CurrentProcessFailed,
            AuthValue.JWTSignFailed,
            AuthValue.ParamsCheckFailed,
        ].includes(result as any)
    ) {
        return {
            status: Status.Failed,
            // @ts-ignore
            code: ErrorCode[result],
        };
    }

    return {
        status: Status.Success,
        data: JSON.parse(result),
    };
};

interface WechatLoginProcessBody {
    authID: string;
}

export const wechatLoginProcessSchemaType: JSONSchemaType<WechatLoginProcessBody> = {
    type: "object",
    required: ["authID"],
    properties: {
        authID: {
            type: "string",
        },
    },
};

type WechatLoginProcessResponse = {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
};
