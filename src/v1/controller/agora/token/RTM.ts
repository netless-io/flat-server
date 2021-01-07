import { Status } from "../../../../Constants";
import { PatchRequest, Response } from "../../../types/Server";
import { getRTMToken } from "../../../utils/AgoraToken";

export const generateRTM = async (req: PatchRequest): Response<GenerateRTMResponse> => {
    const token = await getRTMToken(req.user.userUUID);

    return {
        status: Status.Success,
        data: {
            token,
        },
    };
};

interface GenerateRTMResponse {
    token: string;
}
