import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Region, Status } from "../../../../constants/Project";
import { PeriodicStatus, RoomStatus, Week } from "../../../../model/room/Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomPeriodicConfigDAO, RoomPeriodicUserDAO, UserDAO } from "../../../../dao";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { RoomPeriodicModel } from "../../../../model/room/RoomPeriodic";
import { RoomRecordModel } from "../../../../model/room/RoomRecord";
import { getInviteCode } from "./Utils";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/info/periodic",
    auth: true,
})
export class PeriodicInfo extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["periodicUUID"],
            properties: {
                periodicUUID: {
                    type: "string",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { periodicUUID } = this.body;
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

        const periodicConfig = await RoomPeriodicConfigDAO().findOne(
            [
                "end_time",
                "rate",
                "owner_uuid",
                "periodic_status",
                "room_type",
                "title",
                "weeks",
                "region",
            ],
            {
                periodic_uuid: periodicUUID,
            },
        );

        if (periodicConfig === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const { title, rate, end_time, owner_uuid, room_type, periodic_status, weeks, region } =
            periodicConfig;

        const userInfo = await UserDAO().findOne(["user_name"], {
            user_uuid: owner_uuid,
        });

        if (userInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }

        if (periodic_status === PeriodicStatus.Stopped) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicIsEnded,
            };
        }

        const rooms: Array<PeriodicSubRooms> = await dataSource
            .createQueryBuilder(RoomPeriodicModel, "rp")
            .leftJoin(
                RoomRecordModel,
                "rr",
                "rr.room_uuid = rp.fake_room_uuid AND rr.is_delete = false",
            )
            .addSelect("rp.room_status", "roomStatus")
            .addSelect("rp.begin_time", "beginTime")
            .addSelect("rp.end_time", "endTime")
            .addSelect("rp.fake_room_uuid", "roomUUID")
            .addSelect("rr.id", "hasRecord")
            .andWhere("rp.periodic_uuid = :periodicUUID", { periodicUUID })
            .andWhere("rp.room_status != :roomStatus", { roomStatus: RoomStatus.Stopped })
            .andWhere("rp.is_delete = false")
            .getRawMany();

        // only in the case of very boundary, will come here
        if (rooms.length === 0) {
            return {
                status: Status.Failed,
                code: ErrorCode.ServerFail,
            };
        }

        return {
            status: Status.Success,
            data: {
                periodic: {
                    ownerUUID: owner_uuid,
                    ownerUserName: userInfo.user_name,
                    ownerName: userInfo.user_name,
                    roomType: room_type,
                    endTime: end_time.valueOf(),
                    rate: rate || null,
                    title,
                    weeks: weeks.split(",").map(week => Number(week)) as Week[],
                    region,
                    inviteCode: await getInviteCode(periodicUUID, this.logger),
                },
                rooms: rooms.map(({ roomUUID, roomStatus, beginTime, endTime, hasRecord }) => {
                    return {
                        roomUUID,
                        beginTime: beginTime.valueOf(),
                        endTime: endTime.valueOf(),
                        roomStatus,
                        hasRecord: !!hasRecord,
                    };
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
        periodicUUID: string;
    };
}

interface ResponseType {
    periodic: {
        ownerUUID: string;
        ownerUserName: string;
        ownerName: string;
        roomType: string;
        endTime: number;
        rate: number | null;
        title: string;
        weeks: Week[];
        region: Region;
        inviteCode: string;
    };
    rooms: Array<{
        roomUUID: string;
        beginTime: number;
        endTime: number;
        roomStatus: RoomStatus;
        hasRecord: boolean;
    }>;
}

interface PeriodicSubRooms {
    roomUUID: string;
    beginTime: Date;
    endTime: Date;
    roomStatus: RoomStatus;
    hasRecord: number | null;
}
