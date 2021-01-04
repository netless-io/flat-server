import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { createQueryBuilder, getRepository } from "typeorm";
import { Status } from "../../../../Constants";
import { RoomModel } from "../../../model/room/Room";
import { RoomUserModel } from "../../../model/room/RoomUser";
import { UserModel } from "../../../model/user/User";
import { getRTCToken, getRTMToken } from "../../../utils/AgoraToken";

export const userInfo = async (
    req: PatchRequest<{
        Body: UserInfoBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { roomUUID } = req.body;
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

        const roomInfoPromise = getRepository(RoomModel).findOne({
            select: ["owner_uuid", "title"],
            where: {
                room_uuid: roomUUID,
                is_delete: false,
            },
        });

        const roomUserListPromise = createQueryBuilder(RoomUserModel, "ru")
            .addSelect("ru.user_int_uuid", "user_int_uuid")
            .addSelect("ru.user_uuid", "user_uuid")
            .addSelect("u.user_name", "user_name")
            .addSelect("u.sex", "sex")
            .addSelect("u.avatar_url", "avatar_url")
            .innerJoin(UserModel, "u", "u.user_uuid = ru.user_uuid")
            .where({
                room_uuid: roomUUID,
                is_delete: false,
            })
            .getRawMany();

        await Promise.all([roomInfoPromise, roomUserListPromise]);

        const roomInfo = await roomInfoPromise;
        const roomUserList: RoomUserList[] = await roomUserListPromise;

        if (roomInfo === undefined || roomUserList === undefined) {
            return reply.send({
                status: Status.Failed,
                message: "Room not found",
            });
        }

        let owner: UserInfo = {} as UserInfo;
        let myself: MySelfInfo = {} as MySelfInfo;
        const learners: UserInfo[] = [];

        for (const { user_name, user_uuid, user_int_uuid, avatar_url, sex } of roomUserList) {
            const userInfo = {
                userIntUUID: Number(user_int_uuid),
                userUUID: user_uuid,
                userName: user_name,
                avatarURL: avatar_url,
                sex,
            };

            if (user_uuid === roomInfo.owner_uuid) {
                owner = userInfo;
            } else {
                learners.push(userInfo);
            }

            if (user_uuid === userUUID) {
                myself = {
                    ...userInfo,
                    rtcToken: await getRTCToken(roomUUID, userInfo.userIntUUID),
                    rtmToken: await getRTMToken(userUUID),
                };
            }
        }

        return reply.send({
            status: Status.Success,
            data: {
                owner,
                myself,
                learners,
            },
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "Get room users info failed",
        });
    }
};

interface RoomUserList {
    user_uuid: string;
    user_int_uuid: string;
    user_name: string;
    avatar_url: string;
    sex: number;
}

interface UserInfo {
    userUUID: string;
    userIntUUID: number;
    userName: string;
    avatarURL: string;
    sex: number;
}

interface MySelfInfo extends UserInfo {
    rtmToken: string;
    rtcToken: string;
}

interface UserInfoBody {
    roomUUID: string;
}

export const userInfoSchemaType: FastifySchema<{
    body: UserInfoBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                maxLength: 40,
            },
        },
    },
};
