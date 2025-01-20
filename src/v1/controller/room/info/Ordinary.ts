import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Region, Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import { RoomDAO, RoomUserDAO, UserDAO, UserPmiDAO } from "../../../../dao";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { getInviteCode } from "./Utils";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/info/ordinary",
    auth: true,
})
export class OrdinaryInfo extends AbstractController<RequestType, ResponseType> {
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

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID } = this.body;
        const userUUID = this.userUUID;

        const roomUserInfo = await RoomUserDAO().findOne(["id"], {
            user_uuid: userUUID,
            room_uuid: roomUUID,
        });

        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const roomInfo = await RoomDAO().findOne(
            [
                "title",
                "begin_time",
                "end_time",
                "room_type",
                "room_status",
                "owner_uuid",
                "region",
                "periodic_uuid",
                "has_record",
                "is_ai"
            ],
            {
                room_uuid: roomUUID,
            },
        );

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const {
            title,
            begin_time,
            end_time,
            room_type,
            room_status,
            owner_uuid,
            region,
            periodic_uuid: periodicUUID,
            has_record,
            is_ai
        } = roomInfo;

        const userInfo = await UserDAO().findOne(["user_name"], {
            user_uuid: owner_uuid,
        });

        if (userInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }
        const inviteCode = await getInviteCode(periodicUUID || roomUUID, this.logger);

        let isPmi = false;
        if (inviteCode.length < 32) {
            isPmi = !!(await UserPmiDAO().findOne(["id"], { pmi: inviteCode }));
        }

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
                    ownerUserName: userInfo.user_name,
                    ownerName: userInfo.user_name,
                    hasRecord: has_record,
                    region,
                    inviteCode,
                    isPmi,
                    isAI: is_ai
                },
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
        ownerUserName: string;
        ownerName: string;
        hasRecord: boolean;
        region: Region;
        inviteCode: string;
        isPmi: boolean;
        isAI?: boolean;
    };
}
