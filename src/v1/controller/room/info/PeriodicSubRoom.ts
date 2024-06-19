import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Region, Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import {
    RoomDAO,
    RoomPeriodicConfigDAO,
    RoomPeriodicDAO,
    RoomPeriodicUserDAO,
    RoomRecordDAO,
} from "../../../../dao";
import { LessThan, MoreThan, Not } from "typeorm";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { getInviteCode } from "./Utils";
import { ControllerError } from "../../../../error/ControllerError";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/info/periodic-sub-room",
    auth: true,
})
export class PeriodicSubRoomInfo extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID", "periodicUUID"],
            properties: {
                roomUUID: {
                    type: "string",
                },
                periodicUUID: {
                    type: "string",
                },
                needOtherRoomTimeInfo: {
                    type: "boolean",
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { periodicUUID, roomUUID, needOtherRoomTimeInfo } = this.body;
        const userUUID = this.userUUID;

        const periodicRoomUserInfo = await RoomPeriodicUserDAO().findOne(["id"], {
            periodic_uuid: periodicUUID,
            user_uuid: userUUID,
        });

        if (periodicRoomUserInfo === undefined) {
            const periodicRoomInfo = await RoomPeriodicDAO().findOne(["id"], {
                fake_room_uuid: roomUUID,
                room_status: RoomStatus.Stopped,
            });

            if (periodicRoomInfo === undefined) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.PeriodicNotFound,
                };
            }

            return await this.viewAlreadyEndSubRoomAtCanceledPeriodicRoom();
        }

        const periodicRoomInfo = await RoomPeriodicDAO().findOne(
            ["room_status", "begin_time", "end_time"],
            {
                fake_room_uuid: roomUUID,
            },
        );

        if (periodicRoomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const { room_status, begin_time, end_time } = periodicRoomInfo;

        const periodicConfigInfo = await RoomPeriodicConfigDAO().findOne(
            ["title", "owner_uuid", "room_type", "region"],
            {
                periodic_uuid: periodicUUID,
            },
        );

        if (periodicConfigInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const { title, owner_uuid, room_type, region } = periodicConfigInfo;

        const {
            previousPeriodicRoomBeginTime,
            nextPeriodicRoomBeginTime,
            nextPeriodicRoomEndTime,
        } = await (async (): Promise<{
            previousPeriodicRoomBeginTime: number | null;
            nextPeriodicRoomBeginTime: number | null;
            nextPeriodicRoomEndTime: number | null;
        }> => {
            if (userUUID !== periodicConfigInfo.owner_uuid || !needOtherRoomTimeInfo) {
                return {
                    previousPeriodicRoomBeginTime: null,
                    nextPeriodicRoomBeginTime: null,
                    nextPeriodicRoomEndTime: null,
                };
            }

            const previousPeriodicRoom = await RoomPeriodicDAO().findOne(
                ["begin_time"],
                {
                    periodic_uuid: periodicUUID,
                    begin_time: LessThan(periodicRoomInfo.begin_time),
                },
                ["begin_time", "DESC"],
            );

            const nextPeriodicRoom = await RoomPeriodicDAO().findOne(
                ["begin_time", "end_time"],
                {
                    periodic_uuid: periodicUUID,
                    begin_time: MoreThan(periodicRoomInfo.begin_time),
                },
                ["begin_time", "ASC"],
            );

            return {
                previousPeriodicRoomBeginTime: previousPeriodicRoom
                    ? previousPeriodicRoom.begin_time.valueOf()
                    : null,
                nextPeriodicRoomBeginTime: nextPeriodicRoom
                    ? nextPeriodicRoom.begin_time.valueOf()
                    : null,
                nextPeriodicRoomEndTime: nextPeriodicRoom
                    ? nextPeriodicRoom.end_time.valueOf()
                    : null,
            };
        })();

        const recordInfo = await RoomRecordDAO().findOne(["id"], {
            room_uuid: roomUUID,
        });

        return {
            status: Status.Success,
            data: {
                roomInfo: {
                    title,
                    beginTime: begin_time.valueOf(),
                    endTime: end_time.valueOf(),
                    roomType: room_type,
                    roomStatus: room_status,
                    ownerUUID: owner_uuid,
                    hasRecord: !!recordInfo,
                    region,
                    inviteCode: await getInviteCode(periodicUUID, this.logger),
                },
                previousPeriodicRoomBeginTime,
                nextPeriodicRoomBeginTime,
                nextPeriodicRoomEndTime,
                count: await RoomPeriodicDAO().count({
                    periodic_uuid: periodicUUID,
                    room_status: Not(RoomStatus.Stopped),
                }),
            },
        };
    }

    private async viewAlreadyEndSubRoomAtCanceledPeriodicRoom(): Promise<Response<ResponseType>> {
        const roomInfo = await RoomDAO().findOne(
            [
                "title",
                "begin_time",
                "end_time",
                "room_type",
                "room_status",
                "owner_uuid",
                "region",
                "has_record",
            ],
            {
                room_uuid: this.body.roomUUID,
            },
        );

        if (roomInfo === undefined) {
            throw new ControllerError(ErrorCode.PeriodicNotFound);
        }

        const {
            title,
            begin_time: beginTime,
            end_time: endTime,
            room_type: roomType,
            room_status: roomStatus,
            owner_uuid: ownerUUID,
            region,
            has_record,
        } = roomInfo;

        return {
            status: Status.Success,
            data: {
                roomInfo: {
                    title,
                    beginTime: beginTime.valueOf(),
                    endTime: endTime.valueOf(),
                    roomType,
                    roomStatus,
                    ownerUUID,
                    hasRecord: has_record,
                    region,
                    inviteCode: this.body.roomUUID,
                },
                nextPeriodicRoomEndTime: null,
                nextPeriodicRoomBeginTime: null,
                previousPeriodicRoomBeginTime: null,
                count: 1,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
        periodicUUID: string;
        needOtherRoomTimeInfo?: boolean;
    };
}

interface ResponseType {
    roomInfo: {
        title: string;
        beginTime: number;
        endTime: number;
        roomType: RoomType;
        roomStatus: RoomStatus;
        ownerUUID: string;
        hasRecord: boolean;
        region: Region;
        inviteCode: string;
    };
    previousPeriodicRoomBeginTime: number | null;
    nextPeriodicRoomBeginTime: number | null;
    nextPeriodicRoomEndTime: number | null;
    count: number;
}
