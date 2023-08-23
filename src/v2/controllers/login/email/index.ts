import { Type } from "@sinclair/typebox";
import { FastifyReply } from "fastify";
import { LoginPlatform } from "../../../../constants/Project";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { EmailLoginReturn, UserEmailService } from "../../../services/user/email";
import { successJSON } from "../../internal/utils/response-json";

export const loginEmailSchema = {
    body: Type.Object(
        {
            email: Type.String({
                format: "email",
            }),
            password: Type.String({
                format: "user-password",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const loginEmail = async (
    req: FastifyRequestTypebox<typeof loginEmailSchema>,
    reply: FastifyReply,
): Promise<Response<EmailLoginReturn>> => {
    const service = new UserEmailService(req.ids, req.DBTransaction);

    const jwtSign = (userUUID: string): Promise<string> =>
        reply.jwtSign({
            userUUID,
            loginSource: LoginPlatform.Email,
        });

    const result = await service.login(req.body.email, req.body.password, jwtSign);

    return successJSON(result);
};
