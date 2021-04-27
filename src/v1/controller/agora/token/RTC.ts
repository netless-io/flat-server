import { Status } from "../../../../constants/Project";
import { Controller, FastifySchema } from "../../../../types/Server";
import { getRTCToken } from "../../../utils/AgoraToken";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomUserDAO } from "../../../../dao";
import { parseError } from "../../../../Logger";

export const generateRTC: Controller<GenerateRTCBody, GenerateRTCResponse> = async ({
    req,
    logger,
}) => {
    try {
        const { roomUUID } = req.body;
        const { userUUID } = req.user;

        const roomUserInfo = await RoomUserDAO().findOne(["rtc_uid"], {
            room_uuid: roomUUID,
            user_uuid: userUUID,
        });

        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const token = await getRTCToken(roomUUID, Number(roomUserInfo.rtc_uid));

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

interface GenerateRTCBody {
    body: {
        roomUUID: string;
    };
}

export const generateRTCSchemaType: FastifySchema<GenerateRTCBody> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
            },
        },
    },
};

interface GenerateRTCResponse {
    token: string;
}
