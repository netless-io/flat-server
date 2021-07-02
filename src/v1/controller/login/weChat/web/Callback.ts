import { Controller, FastifySchema } from "../../../../../types/Server";
import redisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { registerOrLoginWechat } from "../Utils";
import { parseError } from "../../../../../logger";

export const callback: Controller<CallbackRequest, any> = async ({ req, logger }, reply) => {
    void reply.headers({
        "content-type": "text/html",
    });
    void reply.send();

    const { state: authUUID, code } = req.query;

    try {
        await registerOrLoginWechat(code, authUUID, "WEB", logger, reply);
    } catch (err: unknown) {
        logger.error("request failed", parseError(err));
        await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);
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
