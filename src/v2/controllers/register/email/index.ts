import { Type } from "@sinclair/typebox";
import { FastifyReply } from "fastify";
import { LoginPlatform } from "../../../../constants/Project";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { EmailRegisterReturn, UserEmailService } from "../../../services/user/email";
import { successJSON } from "../../internal/utils/response-json";

export const registerEmailSchema = {
    body: Type.Object(
        {
            email: Type.String({
                format: "email",
            }),
            code: Type.Integer(),
            password: Type.String({
                format: "user-password",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const registerEmail = async (
    req: FastifyRequestTypebox<typeof registerEmailSchema>,
    reply: FastifyReply,
): Promise<Response<EmailRegisterReturn>> => {
    const service = new UserEmailService(req.ids, req.DBTransaction);

    const jwtSign = (userUUID: string): Promise<string> =>
        reply.jwtSign({
            userUUID,
            loginSource: LoginPlatform.Email,
        });

    const result = await service.register(
        req.body.email,
        req.body.code,
        req.body.password,
        jwtSign,
    );

    return successJSON(result);
};
