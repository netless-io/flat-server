import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { createQueryBuilder } from "typeorm";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomUserDAO } from "../../../../dao";
import { RoomUserModel } from "../../../../model/room/RoomUser";
import { UserModel } from "../../../../model/user/User";
import { Controller } from "../../../../decorator/Controller";
import { AbstractController } from "../../../../abstract/controller";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/info/users",
    auth: true,
})
export class UserInfo extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["roomUUID", "usersUUID"],
            properties: {
                roomUUID: {
                    type: "string",
                    format: "uuid-v4",
                },
                usersUUID: {
                    type: "array",
                    items: {
                        type: "string",
                        format: "uuid-v4",
                    },
                    minItems: 1,
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

        const roomUsersInfo = await createQueryBuilder(RoomUserModel, "ru")
            .addSelect("ru.rtc_uid", "rtc_uid")
            .addSelect("ru.user_uuid", "user_uuid")
            .addSelect("u.user_name", "user_name")
            .addSelect("u.avatar_url", "avatar_url")
            .innerJoin(UserModel, "u", "ru.user_uuid = u.user_uuid")
            .where(
                `room_uuid = :roomUUID
                AND ru.user_uuid IN (:...usersUUID)
                AND ru.is_delete = false
                AND u.is_delete = false`,
                {
                    roomUUID,
                    usersUUID,
                },
            )
            .getRawMany<RoomUsersInfo>();

        if (roomUsersInfo.length === 0) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }

        const result: ResponseType = {};
        for (const { user_name, user_uuid, rtc_uid, avatar_url } of roomUsersInfo) {
            result[user_uuid] = {
                name: user_name,
                rtcUID: Number(rtc_uid),
                avatarURL: avatar_url,
            };
        }

        return {
            status: Status.Success,
            data: result,
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.currentProcessFailed(error);
    }
}

interface RequestType {
    body: {
        roomUUID: string;
        usersUUID: string[];
    };
}

type ResponseType = {
    [key in string]: {
        name: string;
        rtcUID: number;
        avatarURL: string;
    };
};

type RoomUsersInfo = Pick<RoomUserModel, "rtc_uid" | "user_uuid"> &
    Pick<UserModel, "user_name" | "avatar_url">;
