import { FastifySchema, PatchRequest } from "../../../../types/Server";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { FastifyReply } from "fastify";
import { registerOrLoginWechat } from "../Utils";

export const callback = async (
    req: PatchRequest<{
        Querystring: CallbackQuery;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    void reply.headers({
        "content-type": "text/html",
    });
    void reply.send();

    const { state: authUUID, code } = req.query;

    try {
        await registerOrLoginWechat(code, authUUID, "WEB", reply);
    } catch (err: unknown) {
        console.error(err);
        await redisService.set(RedisKey.authFailed(authUUID), "", 60 * 60);
    }
};

interface CallbackQuery {
    state: string;
    code: string;
}

export const callbackSchemaType: FastifySchema<{
    querystring: CallbackQuery;
}> = {
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
