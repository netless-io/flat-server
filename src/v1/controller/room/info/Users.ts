import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomUserDAO } from "../../../../dao";
import { RoomUserModel } from "../../../../model/room/RoomUser";
import { UserModel } from "../../../../model/user/User";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { generateAvatar } from "../../../../utils/Avatar";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/info/users",
    auth: true,
})
export class UserInfo extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID"],
            properties: {
                roomUUID: {
                    type: "string",
                },
                usersUUID: {
                    type: "array",
                    items: {
                        type: "string",
                        format: "uuid-v4",
                    },
                    minItems: 1,
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { roomUUID, usersUUID } = this.body;
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

        const roomUsersInfoBasic = dataSource
            .createQueryBuilder(RoomUserModel, "ru")
            .addSelect("ru.rtc_uid", "rtc_uid")
            .addSelect("ru.user_uuid", "user_uuid")
            .addSelect("u.user_name", "user_name")
            .addSelect("u.avatar_url", "avatar_url")
            .addSelect("u.is_delete", "is_delete")
            .leftJoin(UserModel, "u", "ru.user_uuid = u.user_uuid")
            .andWhere("room_uuid = :roomUUID", {
                roomUUID,
            })
            .andWhere("ru.is_delete = false");

        if (usersUUID) {
            roomUsersInfoBasic.andWhere("ru.user_uuid IN (:...usersUUID)", {
                usersUUID,
            });
        }

        const roomUsersInfo = await roomUsersInfoBasic.getRawMany<RoomUsersInfo>();

        const result: ResponseType = {};
        for (const { user_name, user_uuid, rtc_uid, avatar_url, is_delete, grade } of roomUsersInfo) {
            result[user_uuid] = {
                fake: user_name === null,
                name: user_name || user_uuid.slice(-8),
                rtcUID: is_delete ? -1 : Number(rtc_uid),
                avatarURL: avatar_url || generateAvatar(user_uuid),
                grade
            };
        }

        return {
            status: Status.Success,
            data: result,
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
        usersUUID?: string[];
    };
}

type ResponseType = {
    [key in string]: {
        fake: boolean;
        name: string;
        rtcUID: number;
        avatarURL: string;
        grade: number;
    };
};

type Nullable<T> = { [P in keyof T]: T[P] | null };

type RoomUsersInfo = Pick<RoomUserModel, "rtc_uid" | "user_uuid" | "grade"> & Nullable<Pick<UserModel, "user_name" | "avatar_url" | "is_delete">>;
