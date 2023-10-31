import { EntityManager } from "typeorm";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { roomIsIdle, roomIsRunning } from "../utils/RoomStatus";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { ServiceRoom, ServiceRoomUser } from "../../../service";
import { FlatError } from "../../../../error/FlatError";
import { ControllerError } from "../../../../error/ControllerError";
import { RoomModel } from "../../../../model/room/Room";
import { whiteboardBanRoom } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { parseError } from "../../../../logger";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { getInviteCode } from "../info/Utils";
import { UserPmiDAO } from "../../../../dao";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";

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
                },
            },
        },
    };

    private readonly svc: {
        room: ServiceRoom;
        roomUser: ServiceRoomUser;
    };

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            room: new ServiceRoom(this.body.roomUUID, this.userUUID),
            roomUser: new ServiceRoomUser(this.body.roomUUID, this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        const roomInfo = await this.svc.room.assertInfo([
            "room_status",
            "owner_uuid",
            "periodic_uuid",
            "whiteboard_room_uuid",
            "region",
        ]);

        const { owner_uuid, room_status, region, whiteboard_room_uuid } = roomInfo;

        this.assertRoomValid(roomInfo);

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(this.removeRedisKeyIfNeeded(t));

            commands.push(this.svc.roomUser.removeSelf(t));

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

    private async removeRedisKeyIfNeeded(t?: EntityManager): Promise<void> {
        const inviteCode = await getInviteCode(this.body.roomUUID, this.logger);
        if (inviteCode === this.body.roomUUID) {
            return;
        }

        // If the invite code is PMI, delete it from redis
        const result = await UserPmiDAO(t).findOne(["user_uuid"], { pmi: inviteCode });
        if (result && result.user_uuid === this.userUUID) {
            await RedisService.del([
                RedisKey.roomInviteCode(inviteCode),
                RedisKey.roomInviteCodeReverse(this.body.roomUUID),
            ]);
        }
    }
}

interface RequestType {
    body: {
        roomUUID: string;
    };
}

interface ResponseType {}
