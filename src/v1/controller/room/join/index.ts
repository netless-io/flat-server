import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { joinOrdinary } from "./Ordinary";
import { joinPeriodic } from "./Periodic";
import { RoomPeriodicConfigModel } from "../../../model/room/RoomPeriodicConfig";
import { JoinResponse } from "./Type";
import { ErrorCode } from "../../../../ErrorCode";

export const join = async (
    req: PatchRequest<{
        Body: JoinBody;
    }>,
): Response<JoinResponse> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const uuidIsPeriodicUUID = await getRepository(RoomPeriodicConfigModel).findOne({
            select: ["id"],
            where: {
                periodic_uuid: roomUUID,
            },
        });

        if (uuidIsPeriodicUUID) {
            return await joinPeriodic(roomUUID, userUUID);
        } else {
            return await joinOrdinary(roomUUID, userUUID);
        }
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface JoinBody {
    roomUUID: string;
}

export const joinSchemaType: FastifySchema<{
    body: JoinBody;
}> = {
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
