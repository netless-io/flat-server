import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { createQueryBuilder, SelectQueryBuilder } from "typeorm";
import { RoomUserModel } from "../../../../model/room/RoomUser";
import { RoomModel } from "../../../../model/room/Room";
import { UserModel } from "../../../../model/user/User";
import { ListType, RoomStatus, RoomType } from "../../../../model/room/Constants";
import { Region, Status } from "../../../../constants/Project";

import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { RoomRecordModel } from "../../../../model/room/RoomRecord";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/list/:type",
    auth: true,
})
export class List extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        querystring: {
            type: "object",
            required: ["page"],
            properties: {
                page: {
                    type: "integer",
                    maximum: 50,
                    minimum: 1,
                },
            },
        },
        params: {
            type: "object",
            required: ["type"],
            properties: {
                type: {
                    type: "string",
                    enum: [ListType.All, ListType.Today, ListType.Periodic, ListType.History],
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const rooms = await this.queryRoomsByType();

        const resp: ResponseType = rooms.map(room => {
            return {
                roomUUID: room.roomUUID,
                periodicUUID: room.periodicUUID || null,
                ownerUUID: room.ownerUUID,
                roomType: room.roomType,
                title: room.title,
                beginTime: room.beginTime.valueOf(),
                endTime: room.endTime.valueOf(),
                roomStatus: room.roomStatus,
                ownerName: room.ownerName,
                region: room.region,
                hasRecord: !!room.hasRecord,
            };
        });

        return {
            status: Status.Success,
            data: resp,
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private basisQuery(): SelectQueryBuilder<RoomUserModel> {
        return createQueryBuilder(RoomUserModel, "ru")
            .innerJoin(RoomModel, "r", "ru.room_uuid = r.room_uuid")
            .innerJoin(UserModel, "u", "u.user_uuid = r.owner_uuid")
            .addSelect("r.title", "title")
            .addSelect("r.room_uuid", "roomUUID")
            .addSelect("r.periodic_uuid", "periodicUUID")
            .addSelect("r.room_type", "roomType")
            .addSelect("r.begin_time", "beginTime")
            .addSelect("r.end_time", "endTime")
            .addSelect("r.owner_uuid", "ownerUUID")
            .addSelect("r.room_status", "roomStatus")
            .addSelect("r.region", "region")
            .addSelect("u.user_name", "ownerName")
            .andWhere("ru.user_uuid = :userUUID", {
                userUUID: this.userUUID,
            })
            .andWhere("ru.is_delete = false")
            .andWhere("r.is_delete = false")
            .andWhere("u.is_delete = false")
            .orderBy({
                "r.begin_time": this.params.type === ListType.History ? "DESC" : "ASC",
            })
            .offset((this.querystring.page - 1) * 50)
            .limit(50);
    }

    private async queryRoomsByType(): Promise<ResponseType> {
        let queryBuilder = this.basisQuery();

        switch (this.params.type) {
            case ListType.All: {
                queryBuilder = queryBuilder.andWhere("r.room_status <> :notRoomStatus", {
                    notRoomStatus: RoomStatus.Stopped,
                });
                break;
            }
            case ListType.Today: {
                queryBuilder = queryBuilder
                    .andWhere("DATE(r.begin_time) = CURDATE()")
                    .andWhere("r.room_status <> :notRoomStatus", {
                        notRoomStatus: RoomStatus.Stopped,
                    });
                break;
            }
            case ListType.Periodic: {
                queryBuilder = queryBuilder
                    .andWhere("r.room_status <> :notRoomStatus", {
                        notRoomStatus: RoomStatus.Stopped,
                    })
                    .andWhere("length(r.periodic_uuid) <> 0");
                break;
            }
            case ListType.History: {
                queryBuilder = queryBuilder
                    .leftJoin(
                        qb => {
                            return qb
                                .subQuery()
                                .addSelect("temp_rr.room_uuid", "room_uuid")
                                .addSelect("temp_rr.is_delete", "is_delete")
                                .from(RoomRecordModel, "temp_rr")
                                .addGroupBy("room_uuid")
                                .addGroupBy("is_delete");
                        },
                        "rr",
                        "rr.room_uuid = r.room_uuid AND rr.is_delete = false",
                    )
                    .addSelect("rr.room_uuid", "hasRecord")
                    .andWhere("r.room_status = :roomStatus", {
                        roomStatus: RoomStatus.Stopped,
                    });

                break;
            }
        }

        return (await queryBuilder.getRawMany()) as ResponseType;
    }
}

export interface RequestType {
    querystring: {
        page: number;
    };
    params: {
        type: ListType;
    };
}

export type ResponseType = Array<{
    roomUUID: string;
    periodicUUID: string | null;
    roomType: RoomType;
    ownerUUID: string;
    title: string;
    beginTime: number;
    endTime: number;
    roomStatus: RoomStatus;
    ownerName: string;
    hasRecord?: boolean;
    region: Region;
}>;
