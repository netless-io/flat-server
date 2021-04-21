import { FastifySchema, PatchRequest, Response } from "../../types/Server";
import redisService from "../../thirdPartyService/RedisService";
import { RedisKey } from "../../../utils/Redis";
import { Status } from "../../../Constants";
import { ErrorCode } from "../../../ErrorCode";

export const setAuthUUID = async (
    req: PatchRequest<{
        Body: SetAuthUUIDBody;
    }>,
): Response<SetAuthUUIDResponse> => {
    const { authUUID } = req.body;

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
};

interface SetAuthUUIDBody {
    authUUID: string;
}

export const setAuthUUIDSchemaType: FastifySchema<{
    body: SetAuthUUIDBody;
}> = {
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
