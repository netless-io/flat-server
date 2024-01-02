import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../types/Server";
import { RoomAdminService } from "../../services/room/admin";
import { successJSON } from "../internal/utils/response-json";

export const onlineSchema = {
    body: Type.Object({
        roomUUID: Type.String(),
    }),
};

export const online = async (
    req: FastifyRequestTypebox<typeof onlineSchema>,
): Promise<Response> => {
    const service = new RoomAdminService(req.ids, req.DBTransaction);

    await service.online(req.body.roomUUID, req.userUUID);

    return successJSON({});
};
