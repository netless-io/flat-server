import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { DeveloperPartnerService, PartnerRoomInfo } from "../../../services/developer/partner";
import { successJSON } from "../../internal/utils/response-json";

export const developerPartnerListRoomsSchema = {
    headers: Type.Object({
        "x-flat-partner": Type.String(),
    }),
    body: Type.Object({
        userUUID: Type.Optional(Type.String()),
    }),
};

export const developerPartnerListRooms = async (
    req: FastifyRequestTypebox<typeof developerPartnerListRoomsSchema>,
): Promise<Response<PartnerRoomInfo[]>> => {
    const partnerUUID = req.headers["x-flat-partner"];
    const service = new DeveloperPartnerService(req.ids, req.DBTransaction, partnerUUID);

    const result = await service.listRooms(req.body.userUUID);

    return successJSON(result);
};
