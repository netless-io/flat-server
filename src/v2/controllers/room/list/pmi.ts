import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { UserPmiListRoomsReturn, UserPmiService } from "../../../services/user/pmi";
import { successJSON } from "../../internal/utils/response-json";

export const roomListPmiSchema = {
    body: Type.Object({}),
};

export const roomListPmi = async (
    req: FastifyRequestTypebox<typeof roomListPmiSchema>,
): Promise<Response<UserPmiListRoomsReturn>> => {
    const userPmiService = new UserPmiService(req.ids, req.DBTransaction, req.userUUID);

    const result = await userPmiService.listRooms();

    return successJSON(result);
};
