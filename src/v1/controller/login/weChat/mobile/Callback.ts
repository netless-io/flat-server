import { Controller, FastifySchema } from "../../../../../types/Server";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { registerOrLoginWechat } from "../Utils";
import { parseError } from "../../../../../Logger";
import redisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";

export const callback: Controller<CallbackRequest, CallbackResponse> = async (
    { req, logger },
    reply,
) => {
    const { state: authUUID, code } = req.query;

    try {
        return await registerOrLoginWechat(code, authUUID, "MOBILE", logger, reply);
    } catch (err: unknown) {
        logger.error("request failed", parseError(err));
        await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);

        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface CallbackRequest {
    querystring: {
        state: string;
        code: string;
    };
}

export const callbackSchemaType: FastifySchema<CallbackRequest> = {
    querystring: {
        type: "object",
        required: ["state", "code"],
        properties: {
            state: {
                type: "string",
                format: "uuid-v4",
            },
            code: {
                type: "string",
            },
        },
    },
};

interface CallbackResponse {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
}
