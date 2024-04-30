import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { DeveloperPartnerService } from "../../../services/developer/partner";
import { successJSON } from "../../internal/utils/response-json";

export const developerPartnerRemoveRoomSchema = {
    headers: Type.Object({
        "x-flat-partner": Type.String(),
    }),
    body: Type.Object({
        roomUUID: Type.String(),
    }),
};

export const developerPartnerRemoveRoom = async (
    req: FastifyRequestTypebox<typeof developerPartnerRemoveRoomSchema>,
): Promise<Response> => {
    const partnerUUID = req.headers["x-flat-partner"];
    const service = new DeveloperPartnerService(req.ids, req.DBTransaction, partnerUUID);

    await service.removeRoom(req.body.roomUUID);

    return successJSON({});
};
