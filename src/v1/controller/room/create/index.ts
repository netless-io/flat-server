import { DocsType, RoomStatus, RoomType } from "../Constants";
import { Docs } from "../Types";
import { Status } from "../../../../Constants";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { v4 } from "uuid";
import { addHours, compareDesc, subMinutes, toDate } from "date-fns/fp";
import { getConnection } from "typeorm";
import cryptoRandomString from "crypto-random-string";
import { whiteboardCreateRoom } from "../../../utils/Whiteboard";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomDocDAO, RoomUserDAO } from "../../../dao";

export const create = async (
    req: PatchRequest<{
        Body: CreateBody;
    }>,
): Response<CreateResponse> => {
    const { title, type, beginTime, docs } = req.body;
    const { userUUID } = req.user;

    // check beginTime and endTime
    {
        // Because network transmission will consume a little time, there is 1 minute redundancy
        const redundancyTime = subMinutes(Date.now(), 1);
        // beginTime >= redundancyTime
        if (compareDesc(beginTime)(redundancyTime) === -1) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }
    }

    const roomUUID = v4();
    try {
        const roomData = {
            periodic_uuid: "",
            owner_uuid: userUUID,
            title,
            room_type: type,
            room_status: RoomStatus.Pending,
            room_uuid: roomUUID,
            whiteboard_room_uuid: await whiteboardCreateRoom(title),
            begin_time: toDate(beginTime),
            end_time: addHours(1, Date.now()),
        };

        const roomUserData = {
            room_uuid: roomData.room_uuid,
            user_uuid: userUUID,
            rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
        };

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(RoomDAO(t).insert(roomData));

            commands.push(RoomUserDAO(t).insert(roomUserData));

            if (docs) {
                const roomDocData = docs.map(({ uuid, type }) => {
                    return {
                        doc_uuid: uuid,
                        room_uuid: roomData.room_uuid,
                        periodic_uuid: "",
                        doc_type: type,
                        is_preload: true,
                    };
                });
                commands.push(RoomDocDAO(t).insert(roomDocData));
            }

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {
                roomUUID,
            },
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
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
                type: "string",
                enum: [RoomType.OneToOne, RoomType.SmallClass, RoomType.BigClass],
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

interface CreateResponse {
    roomUUID: string;
}
