import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import { RoomPeriodicConfigDAO, RoomPeriodicDAO, RoomPeriodicUserDAO } from "../../../../dao";
import { LessThan, MoreThan, Not } from "typeorm";
import { AbstractController } from "../../../../abstract/Controller";
import { Controller } from "../../../../decorator/Controller";

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
                    format: "uuid-v4",
                },
                periodicUUID: {
                    type: "string",
                    format: "uuid-v4",
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
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
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
            ["title", "owner_uuid", "room_type"],
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

        const { title, owner_uuid, room_type } = periodicConfigInfo;

        const {
            previousPeriodicRoomBeginTime,
            nextPeriodicRoomEndTime,
        } = await (async (): Promise<{
            previousPeriodicRoomBeginTime: number | null;
            nextPeriodicRoomEndTime: number | null;
        }> => {
            if (userUUID !== periodicConfigInfo.owner_uuid || !needOtherRoomTimeInfo) {
                return {
                    previousPeriodicRoomBeginTime: null,
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
                ["end_time"],
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
                nextPeriodicRoomEndTime: nextPeriodicRoom
                    ? nextPeriodicRoom.end_time.valueOf()
                    : null,
            };
        })();

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
                },
                previousPeriodicRoomBeginTime,
                nextPeriodicRoomEndTime,
                count: await RoomPeriodicDAO().count({
                    periodic_uuid: periodicUUID,
                    room_status: Not(RoomStatus.Stopped),
                }),
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
    };
    previousPeriodicRoomBeginTime: number | null;
    nextPeriodicRoomEndTime: number | null;
    count: number;
}
