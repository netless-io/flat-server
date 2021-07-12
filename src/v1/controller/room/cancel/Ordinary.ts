import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { roomIsIdle, roomIsRunning } from "../utils/Room";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { ServiceOrdinary } from "../../../service";
import { FlatError } from "../../../../error/FlatError";
import { ControllerError } from "../../../../error/ControllerError";
import { RoomModel } from "../../../../model/room/Room";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { parseError } from "../../../../logger";
import { ORM, ORMType } from "../../../../utils/ORM";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/cancel/ordinary",
    auth: true,
})
export class CancelOrdinary extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
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

    private readonly svc: {
        room: ServiceOrdinary;
    };

    private readonly orm: ORM;

    public constructor(
        params: ControllerClassParams,
        payload?: {
            serviceOrdinary?: ServiceOrdinary;
            orm?: ORMType;
        },
    ) {
        super(params);

        this.svc = {
            room:
                payload?.serviceOrdinary || new ServiceOrdinary(this.body.roomUUID, this.userUUID),
        };

        this.orm = payload?.orm || new ORM();
    }

    public async execute(): Promise<Response<ResponseType>> {
        const roomInfo = await this.svc.room.info([
            "room_status",
            "owner_uuid",
            "periodic_uuid",
            "whiteboard_room_uuid",
            "region",
        ]);

        const { owner_uuid, room_status, region, whiteboard_room_uuid } = roomInfo;

        this.assertRoomValid(roomInfo);

        await this.orm.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(this.svc.room.removeUser(t));

            if (this.userIsRoomOwner(owner_uuid) && roomIsIdle(room_status)) {
                commands.push(this.svc.room.remove(t));

                await Promise.all(commands);

                // after the room owner cancels the room, block the whiteboard room
                // this operation must be placed in the last place
                // ban whiteboard room should not block the overall process
                whiteboardBanRoom(region, whiteboard_room_uuid).catch(err => {
                    this.logger.warn("ban room failed", parseError(err));
                });

                return;
            } else {
                await Promise.all(commands);
            }
        });

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: FlatError): ResponseError {
        return this.autoHandlerError(error);
    }

    private assertRoomValid(
        roomInfo: Pick<RoomModel, "periodic_uuid" | "owner_uuid" | "room_status">,
    ): void {
        // not support periodic sub room
        if (roomInfo.periodic_uuid !== "") {
            throw new ControllerError(ErrorCode.NotPermission);
        }

        // the owner of the room cannot delete this lesson while the room is running
        if (this.userIsRoomOwner(roomInfo.owner_uuid) && roomIsRunning(roomInfo.room_status)) {
            throw new ControllerError(ErrorCode.RoomIsRunning);
        }
    }

    private userIsRoomOwner(owner_uuid: string): boolean {
        return owner_uuid === this.userUUID;
    }
}

interface RequestType {
    body: {
        roomUUID: string;
    };
}

interface ResponseType {}
