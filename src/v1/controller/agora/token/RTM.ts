import { Status } from "../../../../constants/Project";
import { Controller } from "../../../../types/Server";
import { getRTMToken } from "../../../utils/AgoraToken";
import { parseError } from "../../../../Logger";
import { ErrorCode } from "../../../../ErrorCode";

export const generateRTM: Controller<any, GenerateRTMResponse> = async ({ req, logger }) => {
    try {
        const token = await getRTMToken(req.user.userUUID);

        return {
            status: Status.Success,
            data: {
                token,
            },
        };
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface GenerateRTMResponse {
    token: string;
}
