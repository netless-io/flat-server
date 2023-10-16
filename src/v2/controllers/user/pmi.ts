import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../types/Server";
import { UserPmiService } from "../../services/user/pmi";
import { successJSON } from "../internal/utils/response-json";

export const userPmiSchema = {
    body: Type.Object({
        create: Type.Boolean({
            default: false,
        }),
    }),
};

export const userPmi = async (
    req: FastifyRequestTypebox<typeof userPmiSchema>,
): Promise<Response<{ pmi: string | null }>> => {
    const userPmiService = new UserPmiService(req.ids, req.DBTransaction, req.userUUID);

    let pmi: string | null;
    if (req.body.create) {
        pmi = await userPmiService.getOrCreate();
    } else {
        pmi = await userPmiService.get();
    }

    return successJSON({ pmi });
};
