import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { Status } from "../../../../Constants";
import { joinOrdinary } from "./Ordinary";
import { joinPeriodic } from "./Periodic";
import { JoinResponse } from "./Type";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomPeriodicConfigDAO } from "../../../dao";

export const join = async (
    req: PatchRequest<{
        Body: JoinBody;
    }>,
): Response<JoinResponse> => {
    const { uuid } = req.body;
    const { userUUID } = req.user;

    try {
        const uuidIsPeriodicUUID = await RoomPeriodicConfigDAO().findOne(["id"], {
            periodic_uuid: uuid,
        });

        if (uuidIsPeriodicUUID) {
            return await joinPeriodic(uuid, userUUID);
        } else {
            return await joinOrdinary(uuid, userUUID);
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
    uuid: string;
}

export const joinSchemaType: FastifySchema<{
    body: JoinBody;
}> = {
    body: {
        type: "object",
        required: ["uuid"],
        properties: {
            uuid: {
                type: "string",
            },
        },
    },
};
