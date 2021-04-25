import { FastifySchema, PatchRequest, Response } from "../../../../types/Server";
import { RoomDAO, RoomDocDAO } from "../../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import { DocsType, RoomStatus, RoomType } from "../../../../model/room/Constants";
import { getConnection, In } from "typeorm";
import { Docs } from "../Types";
import { toDate } from "date-fns/fp";
import { checkUpdateBeginAndEndTime, docsDiff } from "./Utils";

export const updateOrdinary = async (
    req: PatchRequest<{
        Body: UpdateOrdinaryBody;
    }>,
): Response<UpdateOrdinaryResponse> => {
    const { roomUUID, beginTime, endTime, title, type, docs } = req.body;
    const { userUUID } = req.user;

    const roomInfo = await RoomDAO().findOne(["room_status", "begin_time", "end_time"], {
        room_uuid: roomUUID,
        owner_uuid: userUUID,
    });

    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotFound,
        };
    }

    if (roomInfo.room_status !== RoomStatus.Idle) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotIsIdle,
        };
    }

    if (!checkUpdateBeginAndEndTime(beginTime, endTime, roomInfo)) {
        return {
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        };
    }

    const roomDocs = await RoomDocDAO().find(["doc_uuid"], {
        room_uuid: roomUUID,
    });

    const { willAddDocs, willRemoveDocs } = docsDiff(roomDocs, docs, {
        room_uuid: roomUUID,
    });

    try {
        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomDAO(t).update(
                    {
                        title,
                        begin_time: toDate(beginTime),
                        end_time: toDate(endTime),
                        room_type: type,
                    },
                    {
                        room_uuid: roomUUID,
                    },
                ),
                RoomDocDAO(t).insert(willAddDocs),
                RoomDocDAO(t).remove({
                    room_uuid: roomUUID,
                    doc_uuid: In(willRemoveDocs),
                }),
            );

            return Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {},
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface UpdateOrdinaryBody {
    roomUUID: string;
    beginTime: number;
    endTime: number;
    title: string;
    type: RoomType;
    docs: Docs[];
}

export const updateOrdinarySchemaType: FastifySchema<{
    body: UpdateOrdinaryBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID", "beginTime", "endTime", "title", "type", "docs"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
            beginTime: {
                type: "number",
                format: "unix-timestamp",
            },
            endTime: {
                type: "number",
                format: "unix-timestamp",
            },
            title: {
                type: "string",
            },
            type: {
                type: "string",
                enum: [RoomType.SmallClass, RoomType.BigClass, RoomType.OneToOne],
                maxLength: 50,
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

interface UpdateOrdinaryResponse {}
