import { Controller, FastifySchema } from "../../../types/Server";
import RedisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../utils/Redis";
import { Status } from "../../../constants/Project";
import { ErrorCode } from "../../../ErrorCode";
import { parseError } from "../../../Logger";

export const loginProcess: Controller<LoginProcessRequest, LoginProcessResponse> = async ({
    req,
    logger,
}) => {
    const { authUUID } = req.body;

    try {
        const hasAuthUUID = await RedisService.get(RedisKey.authUUID(authUUID));

        if (hasAuthUUID === null) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        const authFailed = await RedisService.get(RedisKey.authFailed(authUUID));

        if (authFailed !== null) {
            const code =
                authFailed === "application_suspended"
                    ? ErrorCode.LoginGithubSuspended
                    : authFailed === "redirect_uri_mismatch"
                    ? ErrorCode.LoginGithubURLMismatch
                    : authFailed === "access_denied"
                    ? ErrorCode.LoginGithubAccessDenied
                    : ErrorCode.CurrentProcessFailed;

            return {
                status: Status.Failed,
                code,
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
        logger.error("request failed", parseError(err));

        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface LoginProcessRequest {
    body: {
        authUUID: string;
    };
}

export const loginProcessSchemaType: FastifySchema<LoginProcessRequest> = {
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

type LoginProcessResponse = {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
};
