import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { In, SelectQueryBuilder } from "typeorm";
import { RoomUserModel } from "../../../../model/room/RoomUser";
import { RoomModel } from "../../../../model/room/Room";
import { UserModel } from "../../../../model/user/User";
import { ListType, RoomStatus, RoomType } from "../../../../model/room/Constants";
import { Region, Status } from "../../../../constants/Project";

import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { UserPmiDAO } from "../../../../dao";

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

        const roomUUIDs = rooms.map(roomInfo => {
            return roomInfo.periodicUUID || roomInfo.roomUUID;
        });

        const inviteCodes = await RedisService.mget(roomUUIDs.map(RedisKey.roomInviteCodeReverse));

        const resp: ResponseType = rooms.map((room, index) => {
            return {
                roomUUID: room.roomUUID,
                periodicUUID: room.periodicUUID || null,
                ownerUUID: room.ownerUUID,
                ownerAvatarURL: room.ownerAvatarURL,
                roomType: room.roomType,
                title: room.title,
                beginTime: room.beginTime.valueOf(),
                endTime: room.endTime.valueOf(),
                roomStatus: room.roomStatus,
                ownerName: room.ownerName,
                region: room.region,
                hasRecord: !!room.hasRecord,
                inviteCode: inviteCodes[index] || room.periodicUUID || room.roomUUID,
                isPmi: false,
                isAI: room.isAI
            };
        });

        const ownerUUIDs = Array.from(new Set(resp.map(room => room.ownerUUID)));
        const pmiUsers = await UserPmiDAO().find(["pmi"], { user_uuid: In(ownerUUIDs) });
        const pmiSet = new Set(pmiUsers.map(user => user.pmi));
        resp.forEach(room => {
            room.isPmi = pmiSet.has(room.inviteCode);
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
        return dataSource
            .createQueryBuilder(RoomUserModel, "ru")
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
            .addSelect("r.is_ai", "isAI")
            .addSelect("u.user_name", "ownerName")
            .addSelect("u.avatar_url", "ownerAvatarURL")
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
                    .addSelect("r.has_record", "hasRecord")
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
    ownerAvatarURL: string;
    title: string;
    beginTime: number;
    endTime: number;
    roomStatus: RoomStatus;
    ownerName: string;
    hasRecord?: boolean;
    region: Region;
    inviteCode: string;
    isPmi: boolean;
    isAI: boolean;
}>;
