import { Status } from "../../../../Constants";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { getRTCToken } from "../../../utils/AgoraToken";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomUserDAO } from "../../../dao";

export const generateRTC = async (
    req: PatchRequest<{
        Body: GenerateRTCBody;
    }>,
): Response<GenerateRTCResponse> => {
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
};

interface GenerateRTCBody {
    roomUUID: string;
}

export const generateRTCSchemaType: FastifySchema<{
    body: GenerateRTCBody;
}> = {
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
