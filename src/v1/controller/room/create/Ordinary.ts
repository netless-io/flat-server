import { DocsType, RoomStatus, RoomType } from "../Constants";
import { Docs } from "../Types";
import { Status } from "../../../../Constants";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { v4 } from "uuid";
import { addHours, toDate } from "date-fns/fp";
import { getConnection } from "typeorm";
import cryptoRandomString from "crypto-random-string";
import { whiteboardCreateRoom } from "../../../utils/request/whiteboard/Whiteboard";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomDAO, RoomDocDAO, RoomUserDAO } from "../../../dao";
import {
    beginTimeLessEndTime,
    beginTimeLessRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";

export const createOrdinary = async (
    req: PatchRequest<{
        Body: CreateOrdinaryBody;
    }>,
): Response<CreateOrdinaryResponse> => {
    const { title, type, beginTime, endTime, docs } = req.body;
    const { userUUID } = req.user;

    {
        if (beginTimeLessRedundancyOneMinute(beginTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        if (endTime) {
            if (beginTimeLessEndTime(beginTime, endTime)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                };
            }

            if (timeIntervalLessThanFifteenMinute(beginTime, endTime)) {
                return {
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                };
            }
        }
    }

    const roomUUID = v4();
    try {
        const roomData = {
            periodic_uuid: "",
            owner_uuid: userUUID,
            title,
            room_type: type,
            room_status: RoomStatus.Idle,
            room_uuid: roomUUID,
            whiteboard_room_uuid: await whiteboardCreateRoom(),
            begin_time: toDate(beginTime),
            end_time: endTime ? toDate(endTime) : addHours(1, beginTime),
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

interface CreateOrdinaryBody {
    title: string;
    type: RoomType;
    beginTime: number;
    endTime?: number;
    docs?: Docs[];
}

export const createOrdinarySchemaType: FastifySchema<{
    body: CreateOrdinaryBody;
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
            endTime: {
                type: "integer",
                format: "unix-timestamp",
                nullable: true,
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

interface CreateOrdinaryResponse {
    roomUUID: string;
}
