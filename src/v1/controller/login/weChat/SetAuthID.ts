import { PatchRequest, Response } from "../../../types/Server";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import redisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { AuthValue } from "./Constants";

export const setAuthID = async (
    req: PatchRequest<{
        Body: SetAuthIDBody;
    }>,
): Response<SetAuthIDResponse> => {
    const { authID } = req.body;

    const result = await redisService.set(
        RedisKey.weChatAuthUUID(authID),
        AuthValue.Process,
        60 * 60,
    );

    if (result === null) {
        console.error(`set redis key: ${authID} failed`);

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

interface SetAuthIDBody {
    authID: string;
}

export const setAuthIDSchemaType: JSONSchemaType<SetAuthIDBody> = {
    type: "object",
    required: ["authID"],
    properties: {
        authID: {
            type: "string",
        },
    },
};

interface SetAuthIDResponse {}
