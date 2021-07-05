import { Controller, FastifySchema } from "../../../types/Server";
import redisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../utils/Redis";
import { Status } from "../../../constants/Project";
import { ErrorCode } from "../../../ErrorCode";
import { parseError } from "../../../logger";

export const setAuthUUID: Controller<SetAuthUUIDRequest, SetAuthUUIDResponse> = async ({
    req,
    logger,
}) => {
    const { authUUID } = req.body;

    try {
        const result = await redisService.set(RedisKey.authUUID(authUUID), "", 60 * 60);

        if (result === null) {
            return {
                status: Status.Failed,
                code: ErrorCode.ServerFail,
            };
        } else {
            return {
                status: Status.Success,
                data: {},
            };
        }
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface SetAuthUUIDRequest {
    body: {
        authUUID: string;
    };
}

export const setAuthUUIDSchemaType: FastifySchema<SetAuthUUIDRequest> = {
    body: {
        type: "object",
        required: ["authUUID"],
        properties: {
            authUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};

interface SetAuthUUIDResponse {}
