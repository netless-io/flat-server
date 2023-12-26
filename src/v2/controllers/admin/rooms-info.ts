import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../types/Server";
import { RoomAdminService, RoomsInfo } from "../../services/room/admin";
import { successJSON } from "../internal/utils/response-json";

export const roomsInfoSchema = {
    body: Type.Object({
        UUIDs: Type.Array(Type.String()),
    }),
};

export const roomsInfo = async (
    req: FastifyRequestTypebox<typeof roomsInfoSchema>,
): Promise<Response<RoomsInfo>> => {
    const service = new RoomAdminService(req.ids, req.DBTransaction);

    const roomsInfo = await service.roomsInfo(req.body.UUIDs);

    return successJSON(roomsInfo);
};
