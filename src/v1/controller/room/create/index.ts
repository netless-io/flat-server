import { DocsType, RoomStatus, RoomType } from "../Constants";
import { Docs } from "../Types";
import { Status } from "../../../../Constants";
import { FastifyReply } from "fastify";
import { FastifySchema, PatchRequest } from "../../../types/Server";
import { RoomModel } from "../../../model/room/Room";
import { v4 } from "uuid";
import { UTCDate } from "../../../../utils/Time";
import { compareDesc, subMinutes } from "date-fns/fp";
import { RoomDocModel } from "../../../model/room/RoomDoc";
import { getConnection } from "typeorm";
import { RoomUserModel } from "../../../model/room/RoomUser";
import cryptoRandomString from "crypto-random-string";
import { whiteboardCreateRoom } from "../../../utils/Whiteboard";

export const create = async (
    req: PatchRequest<{
        Body: CreateBody;
    }>,
    reply: FastifyReply,
): Promise<void> => {
    const { title, type, beginTime, docs } = req.body;
    const { userUUID } = req.user;

    // check beginTime and endTime
    {
        // Because network transmission will consume a little time, there is 1 minute redundancy
        const redundancyTime = subMinutes(Date.now(), 1);
        // beginTime >= redundancyTime
        if (compareDesc(beginTime)(redundancyTime) === -1) {
            return reply.send({
                status: Status.Failed,
                message: "Creation room time cannot be less than current time",
            });
        }
    }

    const roomUUID = v4();
    try {
        const time = UTCDate(beginTime);
        const roomData = {
            periodic_uuid: "",
            creator_user_uuid: userUUID,
            title,
            room_type: type,
            room_status: RoomStatus.Pending,
            room_uuid: roomUUID,
            whiteboard_room_uuid: await whiteboardCreateRoom(title),
            begin_time: time,
            end_time: "0",
        };

        const roomUserData: Pick<RoomUserModel, "user_int_uuid" | "room_uuid" | "user_uuid"> = {
            room_uuid: roomData.room_uuid,
            user_uuid: userUUID,
            user_int_uuid: cryptoRandomString({ length: 10, type: "numeric" }),
        };

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(t.insert(RoomModel, roomData));

            commands.push(t.insert(RoomUserModel, roomUserData));

            if (docs) {
                const roomDocData = docs.map(({ uuid, type }) => {
                    return {
                        doc_uuid: uuid,
                        room_uuid: roomData.room_uuid,
                        periodic_uuid: "",
                        doc_type: type,
                        is_preload: false,
                    };
                });
                commands.push(t.insert(RoomDocModel, roomDocData));
            }

            await Promise.all(commands);
        });

        return reply.send({
            status: Status.Success,
            data: {
                roomUUID,
            },
        });
    } catch (e) {
        console.error(e);
        return reply.send({
            status: Status.Failed,
            message: "Failed to create room",
        });
    }
};

interface CreateBody {
    title: string;
    type: RoomType;
    beginTime: number;
    docs?: Docs[];
}

export const createSchemaType: FastifySchema<{
    body: CreateBody;
}> = {
    body: {
        type: "object",
        required: ["title", "type", "beginTime"],
        properties: {
            title: {
                type: "string",
                maxLength: 50,
            },
            type: {
                type: "integer",
                eq: [RoomType.OneToOne, RoomType.SmallClass, RoomType.BigClass],
            },
            beginTime: {
                type: "integer",
                format: "unix-timestamp",
            },
            docs: {
                type: "array",
                nullable: true,
                items: {
                    type: "object",
                    required: ["type", "uuid"],
                    properties: {
                        type: {
                            type: "string",
                            enum: [DocsType.Dynamic, DocsType.Static],
                        },
                        uuid: {
                            type: "string",
                        },
                    },
                },
                maxItems: 10,
            },
        },
    },
};
