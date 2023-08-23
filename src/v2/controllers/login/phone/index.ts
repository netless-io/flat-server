import { Type } from "@sinclair/typebox";
import { FastifyReply } from "fastify";
import { LoginPlatform } from "../../../../constants/Project";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { PhoneLoginReturn, UserPhoneService } from "../../../services/user/phone";
import { successJSON } from "../../internal/utils/response-json";

export const loginPhoneSchema = {
    body: Type.Object(
        {
            phone: Type.String(),
            password: Type.String({
                format: "user-password",
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const loginPhone = async (
    req: FastifyRequestTypebox<typeof loginPhoneSchema>,
    reply: FastifyReply,
): Promise<Response<PhoneLoginReturn>> => {
    const service = new UserPhoneService(req.ids, req.DBTransaction);

    const jwtSign = (userUUID: string): Promise<string> =>
        reply.jwtSign({
            userUUID,
            loginSource: LoginPlatform.Phone,
        });

    const result = await service.login(req.body.phone, req.body.password, jwtSign);

    return successJSON(result);
};
