import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { successJSON } from "../../internal/utils/response-json";
import { RoomExportUsersService } from "../../../services/room/export-users";
import { RoomExportUsersReturn } from "../../../services/room/export-users.type";
import { Type } from "@sinclair/typebox";

export const roomExportUsersSchema = {
    body: Type.Object(
        {
            roomUUID: Type.String(),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const roomExportUsers = async (
    req: FastifyRequestTypebox<typeof roomExportUsersSchema>,
): Promise<Response<RoomExportUsersReturn>> => {
    const roomExportUsersSVC = new RoomExportUsersService(req.ids, req.DBTransaction, req.userUUID);
    await roomExportUsersSVC.assertRoomOwner(req.body.roomUUID);
    const data = await roomExportUsersSVC.roomAndUsersIncludePhone(req.body.roomUUID);

    return successJSON(data);
};
