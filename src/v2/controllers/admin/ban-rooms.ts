import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../types/Server";
import { RoomAdminService } from "../../services/room/admin";
import { successJSON } from "../internal/utils/response-json";

export const banRoomsSchema = {
    body: Type.Object({
        roomUUIDs: Type.Array(Type.String()),
    }),
};

export const banRooms = async (
    req: FastifyRequestTypebox<typeof banRoomsSchema>,
): Promise<Response> => {
    const service = new RoomAdminService(req.ids, req.DBTransaction);

    await service.banRooms(req.body.roomUUIDs);

    return successJSON({});
};
