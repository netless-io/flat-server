import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../types/Server";
import { UserPmiService } from "../../services/user/pmi";
import { successJSON } from "../internal/utils/response-json";

export const userIsPmiSchema = {
    body: Type.Object({
        pmi: Type.String({
            minLength: 1,
        }),
    }),
};

export const userIsPmi = async (
    req: FastifyRequestTypebox<typeof userIsPmiSchema>,
): Promise<Response<{ result: boolean }>> => {
    const userPmiService = new UserPmiService(req.ids, req.DBTransaction, req.userUUID);

    const result = await userPmiService.exist(req.body.pmi);

    return successJSON({ result });
};
