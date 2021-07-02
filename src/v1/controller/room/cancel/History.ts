import { Controller, FastifySchema } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { RoomStatus } from "../../../../model/room/Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomUserDAO } from "../../../../dao";
import { parseError } from "../../../../logger";

export const cancelHistory: Controller<CancelHistoryRequest, CancelHistoryResponse> = async ({
    req,
    logger,
}) => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const roomUserInfo = await RoomUserDAO().findOne(["id"], {
            user_uuid: userUUID,
            room_uuid: roomUUID,
        });

        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const roomInfo = await RoomDAO().findOne(["room_status"], {
            room_uuid: roomUUID,
        });

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        if (roomInfo.room_status !== RoomStatus.Stopped) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotIsEnded,
            };
        }

        await RoomUserDAO().remove({
            room_uuid: roomUUID,
            user_uuid: userUUID,
        });

        return {
            status: Status.Success,
            data: {},
        };
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface CancelHistoryRequest {
    body: {
        roomUUID: string;
    };
}

export const cancelHistorySchemaType: FastifySchema<CancelHistoryRequest> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};

interface CancelHistoryResponse {}
