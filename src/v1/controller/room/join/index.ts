import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { joinOrdinary } from "./Ordinary";
import { joinPeriodic } from "./Periodic";
import { ResponseType } from "./Type";
import { RoomPeriodicConfigDAO } from "../../../../dao";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { parseError } from "../../../../logger";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

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
        const userUUID = this.userUUID;

        let uuid: string = this.body.uuid;
        if (this.isInviteCode()) {
            try {
                const result = await RedisService.get(RedisKey.roomInviteCode(uuid));

                if (result) {
                    uuid = result;
                }
            } catch (error) {
                this.logger.error("get room uuid by invite code failed", parseError(error));
            }

            // this.body.uuid is invite code
            // uuid is room uuid or periodic uuid
            // RedisService.get(RedisKey.roomInviteCode(uuid)) return null
            if (uuid === this.body.uuid) {
                throw new ControllerError(ErrorCode.RoomNotFound);
            }
        }

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

    private isInviteCode(): boolean {
        return /^\d{10}$/.test(this.body.uuid);
    }
}

interface RequestType {
    body: {
        uuid: string;
    };
}
