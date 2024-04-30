import { Type } from "@sinclair/typebox";
import { RoomType } from "../../../../model/room/Constants";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { DeveloperPartnerService } from "../../../services/developer/partner";
import { successJSON } from "../../internal/utils/response-json";

export const developerPartnerCreateRoomSchema = {
    headers: Type.Object({
        "x-flat-partner": Type.String(),
    }),
    body: Type.Object({
        userUUID: Type.String(),
        ownerUUID: Type.String(),
        title: Type.String({ maxLength: 50 }),
        type: Type.Enum(RoomType),
        beginTime: Type.Integer({ format: "unix-timestamp" }),
        endTime: Type.Integer({ format: "unix-timestamp" }),
    }),
};

export const developerPartnerCreateRoom = async (
    req: FastifyRequestTypebox<typeof developerPartnerCreateRoomSchema>,
): Promise<Response<PartnerCreateRoomResult>> => {
    const partnerUUID = req.headers["x-flat-partner"];
    const service = new DeveloperPartnerService(req.ids, req.DBTransaction, partnerUUID);

    const result = await service.createRoom(req.body);

    return successJSON(result);
};

export interface PartnerCreateRoomResult {
    roomUUID: string;
    inviteCode: string;
}
