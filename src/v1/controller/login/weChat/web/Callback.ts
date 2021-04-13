import { PatchRequest } from "../../../../types/Server";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { FastifyReply } from "fastify";
import { AuthValue } from "../Constants";
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

    const { state: authID, code } = req.query;

    try {
        await registerOrLoginWechat(code, authID, "WEB", reply);
    } catch (err: unknown) {
        console.error(err);
        await redisService.set(
            RedisKey.weChatAuthUUID(authID),
            AuthValue.CurrentProcessFailed,
            60 * 60,
        );
    }
};

interface CallbackQuery {
    state: string;
    code: string;
}

export const callbackSchemaType: JSONSchemaType<CallbackQuery> = {
    type: "object",
    required: ["state", "code"],
    properties: {
        state: {
            type: "string",
        },
        code: {
            type: "string",
        },
    },
};
