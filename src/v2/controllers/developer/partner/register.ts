import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { DeveloperPartnerService } from "../../../services/developer/partner";
import { successJSON } from "../../internal/utils/response-json";

export const developerPartnerRegisterSchema = {
    headers: Type.Object({
        "x-flat-partner": Type.String(),
    }),
    body: Type.Object({
        account: Type.String(),
    }),
};

export const developerPartnerRegister = async (
    req: FastifyRequestTypebox<typeof developerPartnerRegisterSchema>,
): Promise<Response<PartnerRegisterResult>> => {
    const partnerUUID = req.headers["x-flat-partner"];
    const service = new DeveloperPartnerService(req.ids, req.DBTransaction, partnerUUID);

    const userUUID = await service.registerUser(req.body.account);

    return successJSON({ userUUID });
};

export interface PartnerRegisterResult {
    userUUID: string | null;
}
