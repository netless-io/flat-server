import { Type } from "@sinclair/typebox";
import { FastifyReply } from "fastify";
import { LoginPlatform } from "../../../../constants/Project";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { PhoneRegisterReturn, UserPhoneService } from "../../../services/user/phone";
import { successJSON } from "../../internal/utils/response-json";

export const registerPhoneSchema = {
    body: Type.Object(
        {
            phone: Type.String(),
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

export const registerPhone = async (
    req: FastifyRequestTypebox<typeof registerPhoneSchema>,
    reply: FastifyReply,
): Promise<Response<PhoneRegisterReturn>> => {
    const service = new UserPhoneService(req.ids, req.DBTransaction);

    const jwtSign = (userUUID: string): Promise<string> =>
        reply.jwtSign({
            userUUID,
            loginSource: LoginPlatform.Phone,
        });

    const result = await service.register(
        req.body.phone,
        req.body.code,
        req.body.password,
        jwtSign,
    );

    return successJSON(result);
};
