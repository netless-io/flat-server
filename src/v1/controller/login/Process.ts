import { PatchRequest, Response } from "../../types/Server";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import RedisService from "../../thirdPartyService/RedisService";
import { RedisKey } from "../../../utils/Redis";
import { Status } from "../../../Constants";
import { ErrorCode } from "../../../ErrorCode";

export const loginProcess = async (
    req: PatchRequest<{
        Body: LoginProcessBody;
    }>,
): Response<LoginProcessResponse> => {
    const { authUUID } = req.body;

    try {
        const hasAuthUUID = await RedisService.get(RedisKey.authUUID(authUUID));

        if (hasAuthUUID === null) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        const isAuthFailed = await RedisService.get(RedisKey.authFailed(authUUID));

        if (isAuthFailed !== null) {
            return {
                status: Status.Failed,
                code: ErrorCode.CurrentProcessFailed,
            };
        }

        const userInfo = await RedisService.get(RedisKey.authUserInfo(authUUID));

        if (userInfo === null) {
            return {
                status: Status.Success,
                data: {
                    name: "",
                    avatar: "",
                    userUUID: "",
                    token: "",
                },
            };
        }

        return {
            status: Status.Success,
            data: JSON.parse(userInfo),
        };
    } catch (err) {
        console.error(err);

        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface LoginProcessBody {
    authUUID: string;
}

export const loginProcessSchemaType: JSONSchemaType<LoginProcessBody> = {
    type: "object",
    required: ["authUUID"],
    properties: {
        authUUID: {
            type: "string",
            format: "uuid-v4",
        },
    },
};

type LoginProcessResponse = {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
};
