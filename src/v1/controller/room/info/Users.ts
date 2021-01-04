import { FastifySchema, PatchRequest } from "../../../types/Server";
import { FastifyReply } from "fastify";
import { createQueryBuilder, getRepository } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { Status } from "../../../../Constants";
import { UserModel } from "../../../model/user/User";

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
                message: "Not have permission",
            });
        }

        const roomUsersInfo = await createQueryBuilder(RoomUserModel, "ru")
            .addSelect("ru.user_int_uuid", "user_int_uuid")
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
                message: "Can't find relevant information",
            });
        }

        const result: Result = {};
        for (const { user_name, user_uuid, user_int_uuid, avatar_url } of roomUsersInfo) {
            result[user_uuid] = {
                name: user_name,
                userIntUUID: Number(user_int_uuid),
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
            message: "Get room users info failed",
        });
    }
};

type Result = {
    [key in string]: {
        name: string;
        userIntUUID: number;
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
                format: "uuidV4",
            },
            usersUUID: {
                type: "array",
                items: {
                    type: "string",
                    format: "uuidV4",
                },
                minItems: 1,
            },
        },
    },
};
