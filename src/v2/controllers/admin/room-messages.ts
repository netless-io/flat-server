import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../types/Server";
import { RoomAdminService } from "../../services/room/admin";
import { successJSON } from "../internal/utils/response-json";

export const roomMessagesSchema = {
    body: Type.Array(
        Type.Object({
            roomUUID: Type.String(),
            message: Type.String(),
        }),
    ),
};

export const roomMessages = async (
    req: FastifyRequestTypebox<typeof roomMessagesSchema>,
): Promise<Response> => {
    const service = new RoomAdminService(req.ids, req.DBTransaction);

    await service.roomMessages(req.body);

    return successJSON({});
};
