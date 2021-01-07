import { FastifySchema, PatchRequest } from "../../../types/Server";
import { FastifyReply } from "fastify";
import { createQueryBuilder, getRepository } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { Status } from "../../../../Constants";
import { UserModel } from "../../../model/user/User";
import { ErrorCode } from "../../../../ErrorCode";

export const userInfo = async (
    req: PatchRequest<{
        Body: UserInfoBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { roomUUID, usersUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const checkUserExistRoom = await getRepository(RoomUserModel).findOne({
            select: ["id"],
            where: {
                user_uuid: userUUID,
                room_uuid: roomUUID,
                is_delete: false,
            },
        });

        if (checkUserExistRoom === undefined) {
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.NotPermission,
            });
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
            .getRawMany();

        if (roomUsersInfo === undefined) {
            return reply.send({
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            });
        }

        const result: Result = {};
        for (const { user_name, user_uuid, rtc_uid, avatar_url } of roomUsersInfo) {
            result[user_uuid] = {
                name: user_name,
                rtcUID: Number(rtc_uid),
                avatarURL: avatar_url,
            };
        }

        return reply.send({
            status: Status.Success,
            data: result,
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        });
    }
};

type Result = {
    [key in string]: {
        name: string;
        rtcUID: number;
        avatarURL: string;
    };
};

interface UserInfoBody {
    roomUUID: string;
    usersUUID: string[];
}

export const userInfoSchemaType: FastifySchema<{
    body: UserInfoBody;
}> = {
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
