import { PatchRequest, Response } from "../../../../types/Server";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import redisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { FastifyReply } from "fastify";
import { AuthValue } from "../Constants";
import { Status } from "../../../../../Constants";
import { ErrorCode } from "../../../../../ErrorCode";
import { registerOrLoginWechat } from "../Utils";

export const callback = async (
    req: PatchRequest<{
        Querystring: CallbackQuery;
    }>,
    reply: FastifyReply,
): Response<CallbackResponse> => {
    const { state: authID, code } = req.query;

    try {
        return await registerOrLoginWechat(code, authID, "MOBILE", reply);
    } catch (err: unknown) {
        console.error(err);
        await redisService.set(
            RedisKey.weChatAuthUUID(authID),
            AuthValue.CurrentProcessFailed,
            60 * 60,
        );

        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
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

interface CallbackResponse {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
}
