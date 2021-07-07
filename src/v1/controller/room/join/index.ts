import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { joinOrdinary } from "./Ordinary";
import { joinPeriodic } from "./Periodic";
import { ResponseType } from "./Type";
import { RoomPeriodicConfigDAO } from "../../../../dao";
import { AbstractController } from "../../../../abstract/Controller";
import { Controller } from "../../../../decorator/Controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/join",
    auth: true,
})
export class JoinRoom extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
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

    public async execute(): Promise<Response<ResponseType>> {
        const { uuid } = this.body;
        const userUUID = this.userUUID;

        const uuidIsPeriodicUUID = await RoomPeriodicConfigDAO().findOne(["id"], {
            periodic_uuid: uuid,
        });

        if (uuidIsPeriodicUUID) {
            return await joinPeriodic(uuid, userUUID);
        } else {
            return await joinOrdinary(uuid, userUUID);
        }
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        uuid: string;
    };
}
