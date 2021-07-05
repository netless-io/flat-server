import { Controller, FastifySchema } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { joinOrdinary } from "./Ordinary";
import { joinPeriodic } from "./Periodic";
import { JoinResponse } from "./Type";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomPeriodicConfigDAO } from "../../../../dao";
import { parseError } from "../../../../logger";

export const join: Controller<JoinRequest, JoinResponse> = async ({ req, logger }) => {
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
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface JoinRequest {
    body: {
        uuid: string;
    };
}

export const joinSchemaType: FastifySchema<JoinRequest> = {
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
