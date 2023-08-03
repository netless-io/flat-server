import { Type } from "@sinclair/typebox";
import { FastifyReply } from "fastify";
import { LoginPlatform } from "../../../../constants/Project";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserRebindPhoneService, UserRebindReturn } from "../../../services/user/rebind-phone";
import { successJSON } from "../../internal/utils/response-json";

export const userRebindPhoneSchema = {
    body: Type.Object(
        {
            phone: Type.String(),
            code: Type.Integer(),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const userRebindPhone = async (
    req: FastifyRequestTypebox<typeof userRebindPhoneSchema>,
    reply: FastifyReply,
): Promise<Response<UserRebindReturn>> => {
    const service = new UserRebindPhoneService(req.ids, req.DBTransaction, req.userUUID);

    const jwtSign = (userUUID: string): Promise<string> =>
        reply.jwtSign({ userUUID, loginSource: LoginPlatform.Phone });

    const result = await service.rebind(req.body.phone, req.body.code, jwtSign);

    return successJSON(result);
};
