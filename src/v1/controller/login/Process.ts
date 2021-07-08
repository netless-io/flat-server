import { FastifySchema, Response, ResponseError } from "../../../types/Server";
import RedisService from "../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../utils/Redis";
import { Status } from "../../../constants/Project";
import { ErrorCode } from "../../../ErrorCode";
import { AbstractController } from "../../../abstract/controller";
import { Controller } from "../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "login/process",
    auth: false,
})
export class LoginProcess extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
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

    public async execute(): Promise<Response<ResponseType>> {
        const { authUUID } = this.body;

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
    }

    public errorHandler(error: Error): ResponseError {
        return this.currentProcessFailed(error);
    }
}

interface RequestType {
    body: {
        authUUID: string;
    };
}

type ResponseType = {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
};
